import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { dry_run = false } = await req.json().catch(() => ({}));

    // Fetch all users to email — one digest per user based on their own data
    const allUsers = await base44.asServiceRole.entities.User.list();

    let sent = 0;
    const escapeHtml = (value) => String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

    for (const user of allUsers) {
      if (!user.email) continue;

      // Find this user's company — first by created_by_id, then by email domain match
      let userCompanies = await base44.asServiceRole.entities.Company.filter({ created_by_id: user.id });
      let company = userCompanies[0];

      // Fallback: match by email domain if no company was created by this user
      if (!company) {
        const userDomain = (user.email || '').split('@')[1]?.toLowerCase().replace(/\.(com|io|net|org|co|inc|llc)$/i, '').replace(/[^a-z0-9]/g, '');
        if (userDomain) {
          const allCompanies = await base44.asServiceRole.entities.Company.list();
          company = allCompanies.find((c) => {
            const companySlug = (c.name || '').toLowerCase().replace(/\.(com|io|net|org|co|inc|llc)$/i, '').replace(/[^a-z0-9]/g, '');
            return companySlug && companySlug.includes(userDomain) || (userDomain.includes(companySlug) && companySlug.length > 3);
          });
        }
      }

      if (!company || company.notif_weekly_digest === false) continue;

      // Gather data scoped to this user
      const [integrations, recommendations, contracts, userActivity] = await Promise.all([
        base44.asServiceRole.entities.SaasIntegration.filter({ created_by_id: user.id }),
        base44.asServiceRole.entities.Recommendation.filter({ created_by_id: user.id }),
        base44.asServiceRole.entities.Contract.filter({ created_by_id: user.id }),
        base44.asServiceRole.entities.UserActivity.filter({ created_by_id: user.id }),
      ]);

      // Key metrics
      const totalMonthlySpend = integrations.reduce((sum, i) => sum + (i.monthly_cost || 0), 0);
      const wastedUsers = userActivity.filter((u) => u.wasted_cost_flag);
      const estimatedWaste = wastedUsers.reduce((sum, u) => sum + (u.license_cost_per_month || 0), 0);
      const openRecs = recommendations.filter((r) => r.status === 'Open' || r.status === 'In Progress');
      const highPriorityRecs = openRecs.filter((r) => r.priority === 'High');

      // Contracts expiring in next 60 days
      const now = new Date();
      const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const expiringContracts = contracts.filter((c) => {
        if (!c.renewal_date) return false;
        const d = new Date(c.renewal_date);
        return d >= now && d <= in60;
      });

      // Build email HTML
      const recRows = highPriorityRecs.slice(0, 3).map((r) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${escapeHtml(r.tool_name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${escapeHtml(r.category)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#16a34a;font-weight:600;">$${(r.estimated_monthly_savings || 0).toLocaleString()}/mo</td>
        </tr>`
      ).join('');

      const contractRows = expiringContracts.slice(0, 3).map((c) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${escapeHtml(c.vendor_name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${escapeHtml(c.renewal_date)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">$${(c.monthly_cost || 0).toLocaleString()}/mo</td>
        </tr>`
      ).join('');

      const totalPotentialSavings = openRecs.reduce((sum, r) => sum + (r.estimated_monthly_savings || 0), 0);

      const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);padding:32px 36px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Stack Sixth</h1>
      <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">Weekly SaaS Digest · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>

    <!-- Company -->
    <div style="padding:28px 36px 0;">
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Here's your weekly SaaS health summary for <strong>${escapeHtml(company.name)}</strong>.</p>

      <!-- KPI row -->
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f0f9ff;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#1d4ed8;">$${totalMonthlySpend.toLocaleString()}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Monthly Spend</p>
        </div>
        <div style="flex:1;background:#fef3f2;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#dc2626;">$${estimatedWaste.toLocaleString()}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Est. Waste</p>
        </div>
        <div style="flex:1;background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#16a34a;">$${totalPotentialSavings.toLocaleString()}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Savings Available</p>
        </div>
      </div>

      ${highPriorityRecs.length > 0 ? `
      <!-- Top Recommendations -->
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;">🎯 Top Priority Actions (${highPriorityRecs.length} open)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Tool</th>
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Action</th>
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Savings</th>
          </tr>
        </thead>
        <tbody>${recRows}</tbody>
      </table>` : ''}

      ${expiringContracts.length > 0 ? `
      <!-- Expiring Contracts -->
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#111827;">⏰ Contracts Expiring Soon</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Vendor</th>
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Renewal Date</th>
            <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:11px;text-transform:uppercase;">Cost</th>
          </tr>
        </thead>
        <tbody>${contractRows}</tbody>
      </table>` : ''}

      ${wastedUsers.length > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#92400e;">⚠️ <strong>${wastedUsers.length} inactive licensed seats</strong> detected — potential savings of <strong>$${estimatedWaste.toLocaleString()}/mo</strong> if reclaimed.</p>
      </div>` : ''}
    </div>

    <!-- CTA -->
    <div style="padding:0 36px 32px;text-align:center;">
      <a href="https://stacksixth.com" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;margin-top:8px;">View Full Dashboard →</a>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 36px;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">You're receiving this because weekly digest is enabled in your Stack Sixth settings. <br/>Manage preferences at Settings → Notifications.</p>
    </div>
  </div>
</body>
</html>`;

      // Send one email to this user unless explicitly validating the template.
      if (!dry_run) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `📊 Your Weekly SaaS Digest — ${company.name}`,
          body: emailBody,
        });
        sent++;
      }
    }

    return Response.json({ success: true, sent, dry_run });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}