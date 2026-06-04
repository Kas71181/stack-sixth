import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { audit_id } = await req.json();
    if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });

    const audit = await base44.entities.SoftwareAudit.get(audit_id);
    if (!audit) return Response.json({ error: 'Audit not found' }, { status: 404 });
    if (audit.created_by !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const recommendations = audit.analysis_result?.recommendations || [];
    const existingSoftware = audit.existing_software || [];
    const now = new Date();
    const reportPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const toolsContext = recommendations.map((r) => ({
      name: r.name,
      category: r.category,
      monthly_cost: r.estimated_monthly_cost,
      savings_opportunity: r.estimated_savings_opportunity,
      priority: r.implementation_priority,
      adopt: r.adopt_now_or_later,
      decision: audit.analysis_result?.decisions?.[recommendations.indexOf(r)] || 'pending',
    }));

    const prompt = `
You are a software spend intelligence system doing a periodic monitoring check for ${audit.company_name}.

Company profile:
- Team size: ${audit.team_size}
- Monthly budget: $${audit.monthly_budget || 'unknown'}
- Business type: ${audit.user_type}

Current software stack: ${JSON.stringify(existingSoftware)}

Previously recommended tools with their current adoption decisions:
${JSON.stringify(toolsContext, null, 2)}

Generate a concise monitoring report for period ${reportPeriod} that includes:
1. Overall stack health assessment
2. Which recommended tools have been adopted vs pending vs skipped
3. Estimated current monthly waste or savings realized
4. 3–5 specific actionable recommendations for this period
5. Any tools showing risk flags (e.g. still paying for a tool that was recommended to drop, duplicates persisting, budget overrun)

Respond as JSON matching this schema:
{
  "report_summary": "2–3 sentence executive summary",
  "total_spend_estimate": number (estimated current monthly spend),
  "savings_realized": number (estimated monthly savings already captured),
  "new_savings_identified": number (additional savings still available),
  "flagged_count": number,
  "recommendations": ["string", "string", "string"],
  "tools_snapshot": [
    {
      "name": "string",
      "category": "string",
      "status": "adopted|pending|skipped|at_risk",
      "monthly_cost": number,
      "usage_score": number (0-100, estimated utilization),
      "risk_flag": "string or empty"
    }
  ]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
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
          tools_snapshot: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                status: { type: "string" },
                monthly_cost: { type: "number" },
                usage_score: { type: "number" },
                risk_flag: { type: "string" }
              }
            }
          }
        }
      }
    });

    const report = await base44.entities.ToolMonitor.create({
      audit_id,
      company_name: audit.company_name,
      report_period: reportPeriod,
      report_summary: result.report_summary,
      total_spend: result.total_spend_estimate,
      flagged_tools: result.flagged_count,
      savings_identified: result.new_savings_identified,
      recommendations: result.recommendations,
      tools_snapshot: result.tools_snapshot,
      status: 'generated',
    });

    // Send email notification to the audit owner
    const recItems = (result.recommendations || [])
      .map(r => `<li style="margin:0 0 8px 0;color:#374151;">${r}</li>`)
      .join('');

    const toolRows = (result.tools_snapshot || []).slice(0, 8).map(t => {
      const statusColor = t.status === 'adopted' ? '#059669' : t.status === 'at_risk' ? '#dc2626' : t.status === 'skipped' ? '#6b7280' : '#d97706';
      const statusLabel = t.status === 'adopted' ? '✅ Adopted' : t.status === 'at_risk' ? '⚠️ At Risk' : t.status === 'skipped' ? '— Skipped' : '⏳ Pending';
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:500;">${t.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">${t.category || ''}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:${statusColor};">${statusLabel}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:right;">${t.monthly_cost ? `$${t.monthly_cost}/mo` : '—'}</td>
        </tr>`;
    }).join('');

    const emailBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#93c5fd;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Stack Sixth</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Monthly Stack Report</h1>
          <p style="margin:8px 0 0;font-size:15px;color:#bfdbfe;">${audit.company_name} · ${reportPeriod}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 40px;">

          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi ${user.full_name || 'there'},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Your monthly SaaS stack monitoring report is ready. Here's the executive summary:</p>

          <!-- Summary box -->
          <div style="background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">${result.report_summary}</p>
          </div>

          <!-- Stats row -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td width="33%" style="padding:0 6px 0 0;">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#059669;">$${(result.total_spend_estimate || 0).toLocaleString()}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;font-weight:500;">Est. Monthly Spend</div>
                </div>
              </td>
              <td width="33%" style="padding:0 3px;">
                <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#d97706;">$${(result.new_savings_identified || 0).toLocaleString()}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;font-weight:500;">Savings Available</div>
                </div>
              </td>
              <td width="33%" style="padding:0 0 0 6px;">
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:#dc2626;">${result.flagged_count || 0}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:3px;font-weight:500;">Flagged Tools</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Recommendations -->
          ${recItems ? `
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">Action Items This Month</h2>
          <ul style="margin:0 0 28px;padding-left:20px;list-style-type:disc;">${recItems}</ul>
          ` : ''}

          <!-- Tools table -->
          ${toolRows ? `
          <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111827;">Tool Status Snapshot</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Tool</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Category</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Cost</th>
              </tr>
            </thead>
            <tbody>${toolRows}</tbody>
          </table>
          ` : ''}

          <!-- CTA -->
          <div style="text-align:center;margin-top:8px;">
            <a href="${new URL(req.url).origin}/monitoring" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">View Full Report →</a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Stack Sixth AI CFO · You're receiving this because you enabled monitoring for ${audit.company_name}.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `📊 Stack Sixth: Monthly Report Ready — ${audit.company_name} (${reportPeriod})`,
      body: emailBody,
    });

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});