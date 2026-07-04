import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled monthly — records a spend snapshot for every user who has integrations
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const integrations = await base44.entities.SaasIntegration.filter({ created_by_id: user.id });
    const userActivity = await base44.entities.UserActivity.filter({ created_by_id: user.id });

    if (!integrations.length) {
      return Response.json({ skipped: true, reason: 'no integrations' });
    }

    const moment = await import('npm:moment@2.30.1');
    const period = moment.default().format('YYYY-MM');

    const existing = await base44.entities.SpendHistory.filter({ period, created_by_id: user.id });
    const totalSpend = integrations.reduce((s, i) => s + (i.monthly_cost || 0), 0);
    const activeUsers = integrations.reduce((s, i) => s + (i.active_users || 0), 0);
    const wastedTools = userActivity.filter((a) => a.wasted_cost_flag);
    const wastedSpend = wastedTools.reduce((s, a) => {
      return s + (a.license_cost_per_month || 0);
    }, 0);

    const snapshot = integrations.map((i) => ({
      tool_name: i.tool_name,
      category: i.category,
      monthly_cost: i.monthly_cost || 0,
      active_users: i.active_users || 0,
      licensed_seats: i.licensed_seats || 0,
    }));

    const data = {
      period,
      total_spend: totalSpend,
      tool_count: integrations.length,
      active_users: activeUsers,
      wasted_spend: Math.round(wastedSpend),
      snapshot,
    };

    if (existing.length > 0) {
      await base44.entities.SpendHistory.update(existing[0].id, data);
    } else {
      await base44.entities.SpendHistory.create(data);
    }

    return Response.json({ success: true, period, total_spend: totalSpend, tool_count: integrations.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});