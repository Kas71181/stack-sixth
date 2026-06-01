import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get("SALESFORCE_CLIENT_ID");
    const clientSecret = Deno.env.get("SALESFORCE_CLIENT_SECRET");
    const instanceUrl = Deno.env.get("SALESFORCE_INSTANCE_URL");

    if (!clientId || !clientSecret || !instanceUrl) {
      return Response.json({ error: 'Salesforce credentials not configured' }, { status: 400 });
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
    const members = queryData.records || [];

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

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Salesforce' });
    const existingByEmail = new Map(existing.map((r) => [r.user_email, r.id]));

    let created = 0, updated = 0;
    for (const record of activityRecords) {
      if (existingByEmail.has(record.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(record.user_email), record);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create(record);
        created++;
      }
    }

    return Response.json({ success: true, total: activityRecords.length, created, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});