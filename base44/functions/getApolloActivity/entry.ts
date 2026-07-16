import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let user;
    if (body._targetUserId) {
      user = await base44.asServiceRole.entities.User.get(body._targetUserId);
    } else {
      user = await base44.auth.me();
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stored = await base44.asServiceRole.entities.ApiCredential.filter({ service: 'apollo', created_by_id: user.id });
    const credential = stored[0] || null;
    let apiKey = credential?.api_key || null;
    const isOAuth = credential?.extra_fields?.auth_type === 'oauth';
    if (!apiKey) return Response.json({ success: false, not_configured: true, error: 'Apollo is not connected' }, { status: 200 });

    if (isOAuth && credential.extra_fields?.refresh_token && new Date(credential.extra_fields.expires_at || 0).getTime() <= Date.now() + 60000) {
      const refreshRes = await fetch('https://app.apollo.io/api/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credential.extra_fields.refresh_token,
          client_id: Deno.env.get('APOLLO_OAUTH_CLIENT_ID') || '',
          client_secret: Deno.env.get('APOLLO_OAUTH_CLIENT_SECRET') || '',
        }),
      });
      const refreshed = await refreshRes.json();
      if (!refreshRes.ok || !refreshed.access_token) return Response.json({ success: false, error: 'Apollo sign-in expired. Please reconnect Apollo.' }, { status: 200 });
      apiKey = refreshed.access_token;
      await base44.asServiceRole.entities.ApiCredential.update(credential.id, {
        api_key: apiKey,
        extra_fields: {
          ...credential.extra_fields,
          refresh_token: refreshed.refresh_token || credential.extra_fields.refresh_token,
          expires_at: new Date(Date.now() + (refreshed.expires_in || 2592000) * 1000).toISOString(),
        },
      });
    }

    const usersRes = await fetch(isOAuth
      ? 'https://api.apollo.io/api/v1/users/search?page=1&per_page=200'
      : 'https://api.apollo.io/api/v1/users/search', {
      method: isOAuth ? 'GET' : 'POST',
      headers: isOAuth
        ? { 'Authorization': `Bearer ${apiKey}`, 'accept': 'application/json' }
        : { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'accept': 'application/json' },
      body: isOAuth ? undefined : JSON.stringify({ api_key: apiKey, page: 1, per_page: 200 }),
    });

    if (!usersRes.ok) {
      const err = await usersRes.json().catch(() => ({}));
      return Response.json({ success: false, error: `Apollo API error (${usersRes.status}): ${err.message || err.error || (isOAuth ? 'Reconnect Apollo and approve team member access' : 'Check the stored key and its team member access')}` }, { status: 200 });
    }

    const data = await usersRes.json();
    const allMembers = data.users || [];

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
      const lastActive = m.last_activity_date ? new Date(m.last_activity_date) : null;
      const daysSince = lastActive ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)) : 999;
      const activityScore = daysSince <= 7 ? 90 : daysSince <= 14 ? 70 : daysSince <= 30 ? 40 : 10;
      const status = activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Dormant' : 'Inactive';

      return {
        tool_name: 'Apollo.io',
        user_email: m.email,
        user_name: m.name || m.email,
        last_active_date: lastActive ? lastActive.toISOString().split('T')[0] : null,
        days_active_last_30: Math.max(0, 30 - daysSince),
        activity_score: activityScore,
        status,
        wasted_cost_flag: activityScore < 40,
        source: 'live',
        logins_last_30: daysSince <= 30 ? 1 : 0,
        features_used: 0,
        transactions_last_30: 0,
        content_created_last_30: 0,
        api_calls_last_30: 0,
      };
    });

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Apollo.io', created_by_id: user.id });
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