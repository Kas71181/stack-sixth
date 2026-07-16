import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const today = new Date().toISOString().split('T')[0];
    const contracts = await base44.asServiceRole.entities.Contract.filter({});
    const dueContracts = contracts.filter((contract) =>
      contract.reminder_date &&
      contract.reminder_date <= today &&
      contract.reminder_email_sent !== true &&
      contract.reminder_dismissed !== true &&
      contract.status !== 'Cancelled'
    );

    let emailsSent = 0;
    for (const contract of dueContracts) {
      const owner = await base44.asServiceRole.entities.User.get(contract.created_by_id);
      if (!owner?.email) continue;

      const vendorName = String(contract.vendor_name || 'Software tool')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
      const renewalText = contract.renewal_date
        ? `Its renewal date is ${contract.renewal_date}.`
        : 'Review this renewal when convenient.';
      const body = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#172033">
          <p style="font-size:12px;font-weight:700;color:#2563eb;letter-spacing:1px">STACK SIXTH</p>
          <h1 style="font-size:24px;margin:8px 0 12px">Renewal reminder: ${vendorName}</h1>
          <p style="font-size:15px;line-height:1.6;color:#475569">Your custom reminder for <strong>${vendorName}</strong> is due today. ${renewalText}</p>
          <a href="https://stack-sixth-spend.base44.app/renewals" style="display:inline-block;margin-top:18px;background:#2563eb;color:white;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">Review renewal</a>
        </div>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: owner.email,
        subject: `Renewal reminder: ${contract.vendor_name}`,
        body,
      });
      await base44.asServiceRole.entities.Contract.update(contract.id, { reminder_email_sent: true });
      emailsSent++;
    }

    return Response.json({ success: true, emails_sent: emailsSent, reminders_due: dueContracts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});