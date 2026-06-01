import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let apiKey = Deno.env.get("ZOOM_API_KEY");
    if (!apiKey) {
      const stored = await base44.asServiceRole.entities.ApiCredential.filter({ service: 'zoom' });
      apiKey = stored[0]?.api_key || null;
    }
    if (!apiKey) return Response.json({ success: false, not_configured: true, error: 'ZOOM_API_KEY not configured' }, { status: 200 });

    // Fetch users from Zoom
    const usersRes = await fetch('https://api.zoom.us/v2/users?status=active&page_size=300', {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });

    if (!usersRes.ok) {
      const err = await usersRes.json();
      return Response.json({ error: err.message || 'Zoom API error' }, { status: 400 });
    }

    const usersData = await usersRes.json();
    const members = usersData.users || [];

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
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Zoom' });
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