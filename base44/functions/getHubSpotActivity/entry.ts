import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    let apiKey = Deno.env.get("HUBSPOT_API_KEY");
    if (!apiKey) {
      const stored = await base44.asServiceRole.entities.ApiCredential.filter({ service: 'hubspot', created_by_id: user.id });
      if (stored[0]) {
        apiKey = stored[0].api_key || null;
      }
    }
    if (!apiKey) return Response.json({ success: false, not_configured: true, error: 'HubSpot credentials not configured' }, { status: 200 });

    // Fetch users from HubSpot
    const usersRes = await fetch('https://api.hubapi.com/settings/v3/users/', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!usersRes.ok) {
      const err = await usersRes.json().catch(() => ({}));
      const hint = usersRes.status === 403
        ? 'Your Private App token is missing the "settings.users.read" scope. Add it in HubSpot → Settings → Integrations → Private Apps → Scopes.'
        : usersRes.status === 401
        ? 'Invalid or expired token. Regenerate your HubSpot Private App access token.'
        : err.message || 'Check your API key';
      return Response.json({ success: false, error: `HubSpot API error (${usersRes.status}): ${hint}` }, { status: 200 });
    }

    const usersData = await usersRes.json();
    const allMembers = usersData.results || [];

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

    // Fetch recent activity via CRM engagements v3
    const engRes = await fetch('https://api.hubapi.com/crm/v3/objects/engagements?limit=100&properties=hs_lastmodifieddate,hubspot_owner_id', {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const engData = engRes.ok ? await engRes.json() : { results: [] };
    const recentEngagements = engData.results || [];

    // Build a map of owner id -> last engagement date
    const engagementByOwner = {};
    const engagementCountByOwner = {};
    for (const eng of recentEngagements) {
      const ownerId = eng.properties?.hubspot_owner_id;
      const ts = eng.properties?.hs_lastmodifieddate;
      if (ownerId) {
        engagementCountByOwner[ownerId] = (engagementCountByOwner[ownerId] || 0) + 1;
        if (ts && (!engagementByOwner[ownerId] || ts > engagementByOwner[ownerId])) {
          engagementByOwner[ownerId] = ts;
        }
      }
    }

    const now = new Date();
    const activityRecords = members.map((m) => {
      const lastEngTs = engagementByOwner[m.id];
      const lastActive = lastEngTs ? new Date(lastEngTs) : null;
      const daysSince = lastActive ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)) : 999;
      const activityScore = daysSince <= 7 ? 90 : daysSince <= 14 ? 70 : daysSince <= 30 ? 40 : 10;
      const status = activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Dormant' : 'Inactive';

      const engCount = engagementCountByOwner[m.id] || 0;
      return {
        tool_name: 'HubSpot',
        user_email: m.email,
        user_name: `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email,
        last_active_date: lastActive ? lastActive.toISOString().split('T')[0] : null,
        days_active_last_30: Math.max(0, 30 - daysSince),
        activity_score: activityScore,
        status,
        wasted_cost_flag: activityScore < 40,
        source: 'live',
        logins_last_30: daysSince <= 30 ? 1 : 0,
        features_used: engCount > 0 ? Math.min(5, 1 + Math.floor(engCount / 5)) : 0,
        transactions_last_30: engCount,
        content_created_last_30: 0,
        api_calls_last_30: 0,
      };
    });

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'HubSpot', created_by_id: user.id });
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