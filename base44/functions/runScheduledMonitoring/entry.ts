import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requireAdmin } from '../../shared/requireAdmin.ts';

// Called by scheduled automation — no user context, uses service role
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { dry_run = false } = await req.json().catch(() => ({}));

    // Only authenticated administrators may trigger system-wide monitoring.
    const access = await requireAdmin(base44);
    if (access.error) return access.error;

    // Get all active monitors
    const monitors = await base44.asServiceRole.entities.ToolMonitor.filter({ is_active: true });
    const now = new Date();
    const reportPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const results = [];
    const seenAuditIds = new Set();

    for (const monitor of monitors) {
      if (seenAuditIds.has(monitor.audit_id)) {
        results.push({ audit_id: monitor.audit_id, skipped: true, reason: 'duplicate_monitor' });
        continue;
      }
      seenAuditIds.add(monitor.audit_id);

      // Skip if a report for this period already exists
      const existing = await base44.asServiceRole.entities.ToolMonitor.filter({
        audit_id: monitor.audit_id,
        report_period: reportPeriod,
      });
      const alreadyRan = existing.some((r) => r.id !== monitor.id && r.status === 'generated');
      if (alreadyRan) {
        results.push({ audit_id: monitor.audit_id, skipped: true });
        continue;
      }

      const audits = await base44.asServiceRole.entities.SoftwareAudit.filter({ id: monitor.audit_id });
      const audit = audits[0];
      if (!audit) {
        results.push({ audit_id: monitor.audit_id, skipped: true, reason: 'audit_not_found' });
        continue;
      }
      if (audit.status !== 'completed') {
        results.push({ audit_id: monitor.audit_id, skipped: true, reason: 'audit_not_completed' });
        continue;
      }
      if (dry_run) {
        results.push({ audit_id: monitor.audit_id, ready: true });
        continue;
      }

      const recommendations = audit.analysis_result?.recommendations || [];
      const existingSoftware = audit.existing_software || [];

      const toolsContext = recommendations.map((r, i) => ({
        name: r.name,
        category: r.category,
        monthly_cost: r.estimated_monthly_cost,
        savings_opportunity: r.estimated_savings_opportunity,
        decision: audit.analysis_result?.decisions?.[i] || 'pending',
      }));

      const prompt = `
You are a software spend intelligence system doing a scheduled monitoring check for ${audit.company_name}.
Team size: ${audit.team_size}, Monthly budget: $${audit.monthly_budget || 'unknown'}, Type: ${audit.user_type}.
Software stack: ${JSON.stringify(existingSoftware)}
Tool recommendations & decisions: ${JSON.stringify(toolsContext)}

Generate a concise monitoring report for period ${reportPeriod} including:
1. Stack health assessment
2. Adoption status of recommendations
3. Estimated waste or savings realized
4. 3–5 specific actionable recommendations
5. Risk flags for any tools

Respond as JSON:
{
  "report_summary": "string",
  "total_spend_estimate": number,
  "savings_realized": number,
  "new_savings_identified": number,
  "flagged_count": number,
  "recommendations": ["string"],
  "tools_snapshot": [{ "name": "string", "category": "string", "status": "adopted|pending|skipped|at_risk", "monthly_cost": number, "usage_score": number, "risk_flag": "string" }]
}`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            report_summary: { type: "string" },
            total_spend_estimate: { type: "number" },
            savings_realized: { type: "number" },
            new_savings_identified: { type: "number" },
            flagged_count: { type: "number" },
            recommendations: { type: "array", items: { type: "string" } },
            tools_snapshot: { type: "array", items: { type: "object", properties: { name: { type: "string" }, category: { type: "string" }, status: { type: "string" }, monthly_cost: { type: "number" }, usage_score: { type: "number" }, risk_flag: { type: "string" } } } }
          }
        }
      });

      await base44.asServiceRole.entities.ToolMonitor.create({
        audit_id: monitor.audit_id,
        company_name: audit.company_name,
        report_period: reportPeriod,
        report_summary: result.report_summary,
        total_spend: result.total_spend_estimate,
        flagged_tools: result.flagged_count,
        savings_identified: result.new_savings_identified,
        recommendations: result.recommendations,
        tools_snapshot: result.tools_snapshot,
        is_active: false,
        status: 'generated',
        created_by_id: audit.created_by_id,
      });

      // Send email only to the audit owner
      let ownerEmail = null;
      let ownerName = 'there';
      if (audit.created_by_id) {
        const ownerUsers = await base44.asServiceRole.entities.User.filter({ id: audit.created_by_id });
        if (ownerUsers[0]) {
          ownerEmail = ownerUsers[0].email;
          ownerName = ownerUsers[0].full_name || 'there';
        }
      }

      if (ownerEmail) {
        const recItems = (result.recommendations || [])
          .map(r => `<li style="margin:0 0 8px 0;color:#374151;">${r}</li>`)
          .join('');

        const toolRows = (result.tools_snapshot || []).slice(0, 8).map(t => {
          const statusColor = t.status === 'adopted' ? '#059669' : t.status === 'at_risk' ? '#dc2626' : t.status === 'skipped' ? '#6b7280' : '#d97706';
          const statusLabel = t.status === 'adopted' ? '✅ Adopted' : t.status === 'at_risk' ? '⚠️ At Risk' : t.status === 'skipped' ? '— Skipped' : '⏳ Pending';
          return `<tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:500;">${t.name}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">${t.category || ''}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:${statusColor};">${statusLabel}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:right;">${t.monthly_cost ? `$${t.monthly_cost}/mo` : '—'}</td>
          </tr>`;
        }).join('');

        const emailBody = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Stack Sixth</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;">Monthly Stack Report</h1>
          <p style="margin:8px 0 0;font-size:15px;color:#bfdbfe;">${audit.company_name} · ${reportPeriod}</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px 40px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${ownerName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Your monthly SaaS stack monitoring report is ready.</p>
          <div style="background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">${result.report_summary}</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td width="33%" style="padding:0 6px 0 0;">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#059669;">$${(result.total_spend_estimate||0).toLocaleString()}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;">Est. Monthly Spend</div>
                </div>
              </td>
              <td width="33%" style="padding:0 3px;">
                <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#d97706;">$${(result.new_savings_identified||0).toLocaleString()}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;">Savings Available</div>
                </div>
              </td>
              <td width="33%" style="padding:0 0 0 6px;">
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#dc2626;">${result.flagged_count||0}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;">Flagged Tools</div>
                </div>
              </td>
            </tr>
          </table>
          ${recItems ? `<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">Action Items This Month</h2><ul style="margin:0 0 28px;padding-left:20px;">${recItems}</ul>` : ''}
          ${toolRows ? `
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">Tool Status Snapshot</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
            <thead><tr style="background:#f9fafb;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Tool</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Category</th>
              <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Status</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Cost</th>
            </tr></thead>
            <tbody>${toolRows}</tbody>
          </table>` : ''}
          <div style="text-align:center;margin-top:8px;">
            <a href="https://stack-sixth-spend.base44.app/monitoring" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">View Full Report →</a>
          </div>
        </td></tr>
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Stack Sixth · Monitoring report for ${audit.company_name}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ownerEmail,
          subject: `📊 Stack Sixth: Monthly Report Ready — ${audit.company_name} (${reportPeriod})`,
          body: emailBody,
        });
      }

      results.push({ audit_id: monitor.audit_id, generated: true, emailed: ownerEmail || 'no owner found' });
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('Scheduled monitoring failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}