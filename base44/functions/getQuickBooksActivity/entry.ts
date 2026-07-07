import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stored = await base44.entities.ApiCredential.filter({ service: 'quickbooks', created_by_id: user.id });
    const cred = stored[0];
    const accessToken = cred?.api_key || null;
    const realmId = cred?.extra_fields?.realm_id || null;

    if (!accessToken || !realmId) {
      return Response.json({ success: false, not_configured: true, error: 'QuickBooks credentials not configured' }, { status: 200 });
    }

    // Fetch users (employees) from QuickBooks
    const queryRes = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from Employee MAXRESULTS 200&minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/text',
        }
      }
    );

    if (!queryRes.ok) {
      const err = await queryRes.json().catch(() => ({}));
      const qbMsg = err?.Fault?.Error?.[0]?.Message;
      const hint = queryRes.status === 401
        ? 'Your QuickBooks access token has expired (tokens last ~1 hour). Please generate a fresh access token from the Intuit Developer portal and re-enter it.'
        : queryRes.status === 403
        ? 'Permission denied. Ensure your QuickBooks app has the "com.intuit.quickbooks.accounting" scope.'
        : qbMsg || 'Check your Access Token and Company ID (Realm ID).';
      return Response.json({ success: false, error: `QuickBooks error (${queryRes.status}): ${hint}` }, { status: 200 });
    }

    const data = await queryRes.json();
    const allEmployees = data?.QueryResponse?.Employee || [];

    // Auto-detect team domain: use user's email domain, or auto-detect from workspace members
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    let teamDomain = (userDomain && !freeProviders.includes(userDomain)) ? userDomain : null;
    if (!teamDomain) {
      const domainCounts = {};
      for (const emp of allEmployees) {
        const email = emp.PrimaryEmailAddr?.Address?.toLowerCase();
        if (!email) continue;
        const domain = email.split('@')[1];
        if (domain && !freeProviders.includes(domain)) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
      const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) teamDomain = sorted[0][0];
    }
    const employees = teamDomain
      ? allEmployees.filter((emp) => {
          const email = emp.PrimaryEmailAddr?.Address?.toLowerCase();
          return email && email.endsWith('@' + teamDomain);
        })
      : allEmployees;

    const now = new Date();
    const activityRecords = employees.map((emp) => {
      const lastUpdated = emp.MetaData?.LastUpdatedTime ? new Date(emp.MetaData.LastUpdatedTime) : null;
      const daysSince = lastUpdated ? Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24)) : 999;
      const activityScore = emp.Active ? (daysSince <= 30 ? 75 : 50) : 10;
      const status = activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Dormant' : 'Inactive';
      const email = emp.PrimaryEmailAddr?.Address || `${emp.Id}@quickbooks.local`;

      return {
        tool_name: 'QuickBooks',
        user_email: email,
        user_name: emp.DisplayName || `${emp.GivenName || ''} ${emp.FamilyName || ''}`.trim() || email,
        last_active_date: lastUpdated ? lastUpdated.toISOString().split('T')[0] : null,
        days_active_last_30: Math.max(0, 30 - daysSince),
        activity_score: activityScore,
        status,
        wasted_cost_flag: !emp.Active || activityScore < 40,
        source: 'live',
      };
    });

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'QuickBooks', created_by_id: user.id });
    const existingByEmail = new Map(existing.map((r) => [r.user_email, r.id]));

    let created = 0, updated = 0, deleted = 0;
    const syncedEmails = new Set(activityRecords.map((r) => r.user_email));
    for (const record of activityRecords) {
      if (existingByEmail.has(record.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(record.user_email), record);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create({ ...record, created_by_id: user.id });
        created++;
      }
    }
    // Clean up records for members no longer in the filtered team
    for (const old of existing) {
      if (!syncedEmails.has(old.user_email)) {
        await base44.asServiceRole.entities.UserActivity.delete(old.id);
        deleted++;
      }
    }

    return Response.json({ success: true, total: activityRecords.length, created, updated, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});