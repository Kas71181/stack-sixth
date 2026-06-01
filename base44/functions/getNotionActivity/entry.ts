import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const CONNECTOR_ID = '6a1db8b6d0e9930c01976399';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    // 1. Get all workspace users
    const usersRes = await fetch('https://api.notion.com/v1/users?page_size=100', { headers });
    const usersData = await usersRes.json();

    if (!usersData.results) {
      return Response.json({ error: usersData.message || 'Failed to fetch Notion users' }, { status: 400 });
    }

    const realUsers = usersData.results.filter((u) => u.type === 'person');

    // 2. Search for recently edited pages to build per-user last-active signals
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: { value: 'page', property: 'object' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 100,
      }),
    });
    const searchData = await searchRes.json();
    const pages = searchData.results || [];

    // Build a map: user_id -> most recent last_edited_time
    const userLastEdit = new Map();
    for (const page of pages) {
      const editorId = page.last_edited_by?.id;
      const editedTime = page.last_edited_time;
      if (editorId && editedTime) {
        const existing = userLastEdit.get(editorId);
        if (!existing || new Date(editedTime) > new Date(existing)) {
          userLastEdit.set(editorId, editedTime);
        }
      }
    }

    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const userActivity = realUsers.map((u) => {
      const email = u.person?.email || `${u.name?.replace(/\s/g, '.')}@notion`;
      const lastEditStr = userLastEdit.get(u.id) || null;
      const lastEditDate = lastEditStr ? new Date(lastEditStr) : null;
      const daysSinceEdit = lastEditDate ? Math.floor((now - lastEditDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

      // Count pages edited in last 30 days
      const recentEdits = pages.filter(
        (p) => p.last_edited_by?.id === u.id && p.last_edited_time && new Date(p.last_edited_time) >= thirtyDaysAgo
      ).length;

      let status = 'Active';
      let activityScore = 75;
      let daysActive = 18;

      if (daysSinceEdit === null || daysSinceEdit > 90) {
        status = 'Inactive';
        activityScore = 5;
        daysActive = 0;
      } else if (daysSinceEdit > 30) {
        status = 'Dormant';
        activityScore = 30;
        daysActive = 4;
      } else {
        activityScore = Math.min(100, 40 + recentEdits * 8);
        daysActive = Math.min(30, recentEdits * 2);
      }

      return {
        tool_name: 'Notion',
        user_email: email,
        user_name: u.name || email,
        last_active_date: lastEditDate ? lastEditDate.toISOString().split('T')[0] : null,
        days_active_last_30: daysActive,
        activity_score: activityScore,
        status,
        license_cost_per_month: 0,
        wasted_cost_flag: status !== 'Active',
        source: 'live',
      };
    });

    // Upsert into UserActivity
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Notion', created_by_id: user.id });
    const existingByEmail = new Map(existing.map((e) => [e.user_email, e.id]));

    let created = 0, updated = 0;
    for (const ua of userActivity) {
      if (existingByEmail.has(ua.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(ua.user_email), ua);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create({ ...ua, created_by_id: user.id });
        created++;
      }
    }

    return Response.json({ success: true, total: userActivity.length, created, updated, users: userActivity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});