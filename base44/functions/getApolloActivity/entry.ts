import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let apiKey = Deno.env.get("APOLLO_API_KEY");
    if (!apiKey) {
      const stored = await base44.entities.ApiCredential.filter({ service: 'apollo' });
      apiKey = stored[0]?.api_key || null;
    }
    if (!apiKey) return Response.json({ success: false, not_configured: true, error: 'APOLLO_API_KEY not configured' }, { status: 200 });

    // Apollo v1 API — must be POST with JSON body
    const usersRes = await fetch('https://api.apollo.io/api/v1/users/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'accept': 'application/json',
      },
      body: JSON.stringify({ api_key: apiKey, page: 1, per_page: 200 }),
    });

    if (!usersRes.ok) {
      const err = await usersRes.json().catch(() => ({}));
      return Response.json({ success: false, error: `Apollo API error (${usersRes.status}): ${err.message || err.error || 'Check your API key and ensure it has team member read access'}` }, { status: 200 });
    }

    const data = await usersRes.json();
    const allMembers = data.users || [];

    // Auto-detect team: filter to members sharing the authenticated user's email domain
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    const shouldFilter = userDomain && !freeProviders.includes(userDomain);
    const members = shouldFilter
      ? allMembers.filter((m) => m.email?.toLowerCase().endsWith('@' + userDomain))
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
      };
    });

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Apollo.io' });
    const existingByEmail = new Map(existing.map((r) => [r.user_email, r.id]));

    let created = 0, updated = 0, deleted = 0;
    const syncedEmails = new Set(activityRecords.map((r) => r.user_email));
    for (const record of activityRecords) {
      if (existingByEmail.has(record.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(record.user_email), record);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create(record);
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