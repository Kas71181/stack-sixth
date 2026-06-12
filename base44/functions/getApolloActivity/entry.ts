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

    // Fetch users from Apollo.io (v1 API with header-based auth)
    const usersRes = await fetch('https://api.apollo.io/api/v1/users/search?page=1&per_page=200', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Cache-Control': 'no-cache',
        'accept': 'application/json',
      },
    });

    if (!usersRes.ok) {
      const err = await usersRes.json().catch(() => ({}));
      return Response.json({ success: false, error: `Apollo API error (${usersRes.status}): ${err.message || err.error || 'Check your API key'}` }, { status: 200 });
    }

    const data = await usersRes.json();
    const members = data.users || [];

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