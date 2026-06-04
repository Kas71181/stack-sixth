import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    // Target window: 29–31 days from now (catches "one month before")
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() + 29);
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + 31);

    const toISO = (d) => d.toISOString().split('T')[0];

    // Get all generated reports that have tools_snapshot with renewal_date
    const reports = await base44.asServiceRole.entities.ToolMonitor.filter({ status: 'generated' });

    let emailsSent = 0;

    for (const report of reports) {
      const tools = report.tools_snapshot || [];
      const dueTools = tools.filter((t) => {
        if (!t.renewal_date || t.renewal_reminder_sent) return false;
        return t.renewal_date >= toISO(windowStart) && t.renewal_date <= toISO(windowEnd);
      });

      if (dueTools.length === 0) continue;

      // Find the audit to get the owner email
      let audit;
      try {
        audit = await base44.asServiceRole.entities.SoftwareAudit.get(report.audit_id);
      } catch {
        continue;
      }
      if (!audit?.created_by) continue;

      // Check user's reminder frequency preference
      const users = await base44.asServiceRole.entities.User.filter({ email: audit.created_by });
      const userPrefs = users[0];
      const frequency = userPrefs?.reminder_frequency || 'daily';

      if (frequency === 'never') continue;

      // For weekly: only send on Mondays (day 1)
      if (frequency === 'weekly' && now.getDay() !== 1) continue;

      // For monthly: only send on the 1st of the month
      if (frequency === 'monthly' && now.getDate() !== 1) continue;

      // Build styled HTML email
      const toolCards = dueTools.map((t) => {
        const renewalDate = new Date(t.renewal_date);
        const daysLeft = Math.ceil((renewalDate - now) / (1000 * 60 * 60 * 24));
        const urgentColor = daysLeft <= 7 ? '#dc2626' : daysLeft <= 14 ? '#d97706' : '#1d4ed8';
        const urgentBg = daysLeft <= 7 ? '#fef2f2' : daysLeft <= 14 ? '#fefce8' : '#eff6ff';
        const urgentBorder = daysLeft <= 7 ? '#fecaca' : daysLeft <= 14 ? '#fef08a' : '#bfdbfe';
        return `
          <tr>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:36px;height:36px;border-radius:8px;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#3730a3;text-align:center;line-height:36px;">${t.name.charAt(0)}</div>
                <div>
                  <div style="font-size:14px;font-weight:700;color:#111827;">${t.name}</div>
                  ${t.monthly_cost ? `<div style="font-size:12px;color:#6b7280;">$${t.monthly_cost}/mo</div>` : ''}
                </div>
              </div>
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;text-align:center;">
              <span style="display:inline-block;background:${urgentBg};border:1px solid ${urgentBorder};color:${urgentColor};font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;">${daysLeft}d left</span>
            </td>
            <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;text-align:right;">${t.renewal_date}</td>
          </tr>`;
      }).join('');

      const body = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#d97706 0%,#b45309 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:#fde68a;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Stack Sixth</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">⏰ Renewal Alert</h1>
          <p style="margin:8px 0 0;font-size:15px;color:#fef3c7;">${dueTools.length} tool${dueTools.length > 1 ? 's' : ''} renewing soon · ${report.company_name}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 40px;">

          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">Hi,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            The following tools for <strong>${report.company_name}</strong> are coming up for renewal within the next 30 days.
            Now is the perfect time to review usage, negotiate pricing, or evaluate alternatives.
          </p>

          <!-- Tools table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Tool</th>
                <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Time Left</th>
                <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Renewal Date</th>
              </tr>
            </thead>
            <tbody>${toolCards}</tbody>
          </table>

          <!-- Tips box -->
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#065f46;">💡 Before you renew:</p>
            <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;line-height:1.8;">
              <li>Check actual seat utilization in your Stack Sixth dashboard</li>
              <li>Compare with alternatives in your audit recommendations</li>
              <li>Use low utilization data as leverage to negotiate a lower price</li>
            </ul>
          </div>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="https://stack-sixth-spend.base44.app/monitoring" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">Review in Dashboard →</a>
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Stack Sixth AI CFO · Automated renewal reminder for ${report.company_name}.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: audit.created_by,
        subject: `⏰ Renewal Alert: ${dueTools.length} tool${dueTools.length > 1 ? 's' : ''} renewing soon — ${report.company_name}`,
        body,
      });

      // Mark reminder as sent on each tool to avoid duplicates
      const updatedSnapshot = tools.map((t) => {
        const isDue = dueTools.some((d) => d.name === t.name && d.renewal_date === t.renewal_date);
        return isDue ? { ...t, renewal_reminder_sent: true } : t;
      });
      await base44.asServiceRole.entities.ToolMonitor.update(report.id, { tools_snapshot: updatedSnapshot });

      emailsSent++;
    }

    return Response.json({ success: true, emails_sent: emailsSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});