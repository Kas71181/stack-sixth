import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch user's activity data, contracts, and integrations in parallel
    const [activities, contracts, integrations, companies] = await Promise.all([
      base44.entities.UserActivity.filter({ created_by_id: user.id }),
      base44.entities.Contract.filter({ created_by_id: user.id }),
      base44.entities.SaasIntegration.filter({ created_by_id: user.id }),
      base44.entities.Company.filter({ created_by_id: user.id }),
    ]);

    const company = companies[0];
    const now = new Date();
    const alerts = [];

    // ── 1. Dormant tool detection ──
    // Group activity by tool_name
    const toolActivityMap = {};
    for (const a of activities) {
      const key = a.tool_name?.toLowerCase().trim();
      if (!key) continue;
      if (!toolActivityMap[key]) {
        toolActivityMap[key] = { tool_name: a.tool_name, records: [], total_cost: 0, active_users: 0, inactive_users: 0 };
      }
      toolActivityMap[key].records.push(a);
      toolActivityMap[key].total_cost += a.license_cost_per_month || 0;
      if (a.status === 'Active') {
        toolActivityMap[key].active_users++;
      } else {
        toolActivityMap[key].inactive_users++;
      }
    }

    for (const [key, data] of Object.entries(toolActivityMap)) {
      const totalUsers = data.active_users + data.inactive_users;
      const inactivePct = totalUsers > 0 ? Math.round((data.inactive_users / totalUsers) * 100) : 0;
      const avgActivityScore = data.records.length > 0
        ? Math.round(data.records.reduce((s, r) => s + (r.activity_score || 0), 0) / data.records.length)
        : 0;
      const wastedCost = data.records
        .filter((r) => r.wasted_cost_flag || r.status !== 'Active')
        .reduce((s, r) => s + (r.license_cost_per_month || 0), 0);

      // Dormant = >50% inactive OR avg activity score < 30
      if (inactivePct >= 50 || avgActivityScore < 30) {
        const matchingIntegration = integrations.find(
          (i) => i.tool_name?.toLowerCase().trim() === key
        );
        alerts.push({
          type: 'dormant',
          severity: avgActivityScore < 15 ? 'critical' : inactivePct >= 75 ? 'high' : 'medium',
          tool_name: data.tool_name,
          active_users: data.active_users,
          inactive_users: data.inactive_users,
          inactive_pct: inactivePct,
          avg_activity_score: avgActivityScore,
          wasted_cost: wastedCost,
          monthly_cost: matchingIntegration?.monthly_cost || data.total_cost,
          licensed_seats: matchingIntegration?.licensed_seats || totalUsers,
          recommended_action: wastedCost > 500 ? 'downgrade' : 'review',
          integration_id: matchingIntegration?.id || null,
        });
      }
    }

    // ── 2. Renewal decision gates ──
    for (const contract of contracts) {
      if (!contract.renewal_date || contract.status === 'Cancelled' || contract.status === 'Expired') continue;

      const renewalDate = new Date(contract.renewal_date);
      const daysUntilRenewal = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));

      // Only alert for renewals within 90 days
      if (daysUntilRenewal > 90 || daysUntilRenewal < -30) continue;

      // Check if there's activity data for this tool
      const contractActivity = activities.filter(
        (a) => a.tool_name?.toLowerCase().includes(contract.vendor_name?.toLowerCase().split(' ')[0] || '')
      );
      const avgScore = contractActivity.length > 0
        ? Math.round(contractActivity.reduce((s, a) => s + (a.activity_score || 0), 0) / contractActivity.length)
        : null;

      let recommendedAction = 'renew';
      let severity = 'low';
      if (avgScore !== null && avgScore < 30) {
        recommendedAction = 'cancel';
        severity = 'high';
      } else if (avgScore !== null && avgScore < 50) {
        recommendedAction = 'negotiate';
        severity = 'medium';
      } else if (contract.auto_renews && daysUntilRenewal <= contract.notice_period_days) {
        recommendedAction = 'urgent_review';
        severity = 'critical';
      } else if (daysUntilRenewal <= 30) {
        severity = 'high';
      }

      alerts.push({
        type: 'renewal',
        severity,
        tool_name: contract.vendor_name,
        renewal_date: contract.renewal_date,
        days_until_renewal: daysUntilRenewal,
        monthly_cost: contract.monthly_cost || 0,
        annual_cost: contract.annual_cost || 0,
        auto_renews: contract.auto_renews,
        notice_period_days: contract.notice_period_days || 0,
        avg_activity_score: avgScore,
        recommended_action: recommendedAction,
        contract_id: contract.id,
        seats_licensed: contract.seats_licensed || 0,
      });
    }

    // Sort by severity then by wasted cost / days
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const sevDiff = (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
      if (sevDiff !== 0) return sevDiff;
      if (a.type === 'dormant') return (b.wasted_cost || 0) - (a.wasted_cost || 0);
      return (a.days_until_renewal || 0) - (b.days_until_renewal || 0);
    });

    const totalWasted = alerts
      .filter((a) => a.type === 'dormant')
      .reduce((s, a) => s + (a.wasted_cost || 0), 0);
    const totalAtRisk = alerts
      .filter((a) => a.type === 'renewal')
      .reduce((s, a) => s + (a.monthly_cost || 0), 0);

    return Response.json({
      alerts,
      summary: {
        total_alerts: alerts.length,
        dormant_count: alerts.filter((a) => a.type === 'dormant').length,
        renewal_count: alerts.filter((a) => a.type === 'renewal').length,
        critical_count: alerts.filter((a) => a.severity === 'critical').length,
        total_wasted: totalWasted,
        total_at_risk: totalAtRisk,
        company_name: company?.name || 'Your Company',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});