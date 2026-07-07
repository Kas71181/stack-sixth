import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let clientId = Deno.env.get("SALESFORCE_CLIENT_ID");
    let clientSecret = Deno.env.get("SALESFORCE_CLIENT_SECRET");
    let instanceUrl = Deno.env.get("SALESFORCE_INSTANCE_URL");

    if (!clientId || !clientSecret || !instanceUrl) {
      const stored = await base44.entities.ApiCredential.filter({ service: 'salesforce', created_by_id: user.id });
      if (stored[0]) {
        clientId = stored[0].api_key || clientId;
        clientSecret = stored[0].extra_fields?.client_secret || clientSecret;
        instanceUrl = stored[0].extra_fields?.instance_url || instanceUrl;
      }
    }

    if (!clientId || !clientSecret || !instanceUrl) {
      return Response.json({ success: false, not_configured: true, error: 'Salesforce credentials not configured' }, { status: 200 });
    }

    // Get access token via client_credentials flow
    const tokenRes = await fetch(`${instanceUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      return Response.json({ error: err.error_description || 'Salesforce auth failed' }, { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Query users from Salesforce
    const queryRes = await fetch(
      `${instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent("SELECT Id, Name, Email, LastLoginDate, IsActive FROM User WHERE IsActive = true LIMIT 200")}`,
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    if (!queryRes.ok) {
      const err = await queryRes.json();
      return Response.json({ error: (err[0]?.message) || 'Salesforce query failed' }, { status: 400 });
    }

    const queryData = await queryRes.json();
    const allMembers = queryData.records || [];

    // Auto-detect team: filter to members sharing the authenticated user's email domain
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    const shouldFilter = userDomain && !freeProviders.includes(userDomain);
    const members = shouldFilter
      ? allMembers.filter((m) => m.Email?.toLowerCase().endsWith('@' + userDomain))
      : allMembers;

    const now = new Date();
    const activityRecords = members.map((m) => {
      const lastLogin = m.LastLoginDate ? new Date(m.LastLoginDate) : null;
      const daysSince = lastLogin ? Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24)) : 999;
      const activityScore = daysSince <= 7 ? 90 : daysSince <= 14 ? 70 : daysSince <= 30 ? 40 : 10;
      const status = activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Dormant' : 'Inactive';

      return {
        tool_name: 'Salesforce',
        user_email: m.Email,
        user_name: m.Name || m.Email,
        last_active_date: lastLogin ? lastLogin.toISOString().split('T')[0] : null,
        days_active_last_30: Math.max(0, 30 - daysSince),
        activity_score: activityScore,
        status,
        wasted_cost_flag: activityScore < 40,
        source: 'live',
      };
    });

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Salesforce', created_by_id: user.id });
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