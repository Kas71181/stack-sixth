import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

      // Build email body
      const toolLines = dueTools.map((t) =>
        `• <strong>${t.name}</strong> — renews on <strong>${t.renewal_date}</strong>${t.monthly_cost ? ` ($${t.monthly_cost}/mo)` : ''}`
      ).join('<br/>');

      const body = `
<p>Hi,</p>
<p>This is an automated reminder from <strong>Stack Sixth</strong>. The following tools for <strong>${report.company_name}</strong> are coming up for renewal within the next 30 days:</p>
<br/>
${toolLines}
<br/>
<p>Now is a great time to review usage, negotiate pricing, or evaluate alternatives before committing to another term.</p>
<p>Log in to your Stack Sixth dashboard to review and take action.</p>
<br/>
<p>— Stack Sixth AI CFO</p>
      `.trim();

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: audit.created_by,
        subject: `🔔 Renewal Reminder: ${dueTools.length} tool${dueTools.length > 1 ? 's' : ''} renewing soon — ${report.company_name}`,
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