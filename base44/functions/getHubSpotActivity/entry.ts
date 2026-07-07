import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let apiKey = Deno.env.get("HUBSPOT_API_KEY");
    if (!apiKey) {
      const stored = await base44.entities.ApiCredential.filter({ service: 'hubspot', created_by_id: user.id });
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

    // Auto-detect team: filter to members sharing the authenticated user's email domain
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    const shouldFilter = userDomain && !freeProviders.includes(userDomain);
    const members = shouldFilter
      ? allMembers.filter((m) => m.email?.toLowerCase().endsWith('@' + userDomain))
      : allMembers;

    // Fetch recent activity via CRM engagements v3
    const engRes = await fetch('https://api.hubapi.com/crm/v3/objects/engagements?limit=100&properties=hs_lastmodifieddate,hubspot_owner_id', {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const engData = engRes.ok ? await engRes.json() : { results: [] };
    const recentEngagements = engData.results || [];

    // Build a map of owner id -> last engagement date
    const engagementByOwner = {};
    for (const eng of recentEngagements) {
      const ownerId = eng.properties?.hubspot_owner_id;
      const ts = eng.properties?.hs_lastmodifieddate;
      if (ownerId && ts) {
        if (!engagementByOwner[ownerId] || ts > engagementByOwner[ownerId]) {
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