import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Load credentials — need accountId, clientId, clientSecret for Server-to-Server OAuth
    const stored = await base44.entities.ApiCredential.filter({ service: 'zoom', created_by_id: user.id });
    const cred = stored[0];

    if (!cred?.api_key) {
      return Response.json({ success: false, not_configured: true, error: 'Zoom credentials not configured' }, { status: 200 });
    }

    // cred.api_key = Client ID, cred.extra_fields.client_secret = Client Secret, cred.extra_fields.account_id = Account ID
    const clientId = cred.api_key;
    const clientSecret = cred.extra_fields?.client_secret;
    const accountId = cred.extra_fields?.account_id;

    if (!clientSecret || !accountId) {
      return Response.json({ success: false, not_configured: true, error: 'Missing client_secret or account_id. Please reconnect Zoom.' }, { status: 200 });
    }

    // Exchange for an access token using Server-to-Server OAuth
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      const hint = tokenRes.status === 401
        ? 'Invalid Client ID or Secret. Double-check your Server-to-Server OAuth app credentials.'
        : tokenRes.status === 403
        ? 'Missing required admin scopes. In Zoom Marketplace, enable: user:read:admin, user:read:list_users:admin'
        : `Status ${tokenRes.status}`;
      return Response.json({ success: false, error: `Zoom auth failed: ${hint}` }, { status: 200 });
    }

    const { access_token } = await tokenRes.json();

    // Fetch users
    const usersRes = await fetch('https://api.zoom.us/v2/users?status=active&page_size=300', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!usersRes.ok) {
      const err = await usersRes.json().catch(() => ({}));
      const hint = usersRes.status === 401 ? 'Token expired or invalid.'
        : usersRes.status === 4700 ? 'Missing scope: user:read:admin. Add it in your Zoom Server-to-Server app scopes.'
        : err.message || `HTTP ${usersRes.status}`;
      return Response.json({ success: false, error: `Zoom users fetch failed: ${hint}` }, { status: 200 });
    }

    const usersData = await usersRes.json();
    const allMembers = usersData.users || [];

    // Auto-detect team domain: use user's email domain, or auto-detect from workspace members
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    let teamDomain = (userDomain && !freeProviders.includes(userDomain)) ? userDomain : null;
    if (!teamDomain) {
      const domainCounts = {};
      for (const m of allMembers) {
        const email = m.email?.toLowerCase();
        if (!email) continue;
        const domain = email.split('@')[1];
        if (domain && !freeProviders.includes(domain)) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
      const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) teamDomain = sorted[0][0];
    }
    const members = teamDomain
      ? allMembers.filter((m) => m.email?.toLowerCase().endsWith('@' + teamDomain))
      : allMembers;

    const now = new Date();
    const activityRecords = members.map((m) => {
      const lastLogin = m.last_login_time ? new Date(m.last_login_time) : null;
      const daysSinceLogin = lastLogin ? Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24)) : 999;
      const activityScore = daysSinceLogin <= 7 ? 90 : daysSinceLogin <= 14 ? 70 : daysSinceLogin <= 30 ? 40 : 10;
      const status = activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Dormant' : 'Inactive';

      return {
        tool_name: 'Zoom',
        user_email: m.email,
        user_name: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
        last_active_date: lastLogin ? lastLogin.toISOString().split('T')[0] : null,
        days_active_last_30: Math.max(0, 30 - daysSinceLogin),
        activity_score: activityScore,
        status,
        wasted_cost_flag: activityScore < 40,
        source: 'live',
      };
    });

    // Upsert into UserActivity
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Zoom', created_by_id: user.id });
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