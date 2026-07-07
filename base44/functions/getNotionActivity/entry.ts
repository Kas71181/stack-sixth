import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const allRealUsers = usersData.results.filter((u) => u.type === 'person');

    // Auto-detect team domain: use user's email domain, or auto-detect from workspace members
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    let teamDomain = (userDomain && !freeProviders.includes(userDomain)) ? userDomain : null;
    if (!teamDomain) {
      const domainCounts = {};
      for (const u of allRealUsers) {
        const email = u.person?.email?.toLowerCase();
        if (!email) continue;
        const domain = email.split('@')[1];
        if (domain && !freeProviders.includes(domain)) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
      const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) teamDomain = sorted[0][0];
    }
    const realUsers = teamDomain
      ? allRealUsers.filter((u) => {
          const email = u.person?.email?.toLowerCase();
          return email && email.endsWith('@' + teamDomain);
        })
      : allRealUsers;

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
      let activityScore = 0;
      let daysActive = 0;

      if (daysSinceEdit === null || daysSinceEdit > 90) {
        status = 'Inactive';
        activityScore = 5;
        daysActive = 0;
      } else if (daysSinceEdit > 30) {
        status = 'Dormant';
        activityScore = 20;
        daysActive = 0;
      } else {
        // recentEdits = pages this user personally last-edited in last 30 days
        // Each unique edit counts as roughly 1 active day (capped at 30)
        daysActive = Math.min(30, recentEdits);
        activityScore = Math.min(100, 20 + recentEdits * 5);
        status = daysActive === 0 ? 'Dormant' : 'Active';
      }

      // Content created = pages where this user is the creator (not just editor)
      const createdPages = pages.filter(
        (p) => p.created_by?.id === u.id && p.created_time && new Date(p.created_time) >= thirtyDaysAgo
      ).length;

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
        // Deep activity signals
        logins_last_30: daysActive, // days with edits = login proxy
        features_used: recentEdits > 0 ? Math.min(5, 1 + Math.floor(recentEdits / 5)) : 0, // breadth of page interactions
        transactions_last_30: recentEdits, // page edits = transactions
        content_created_last_30: createdPages, // pages created = content created
        api_calls_last_30: 0,
      };
    });

    // Upsert into UserActivity
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Notion', created_by_id: user.id });
    const existingByEmail = new Map(existing.map((e) => [e.user_email, e.id]));

    let created = 0, updated = 0, deleted = 0;
    const syncedEmails = new Set(userActivity.map((ua) => ua.user_email));
    for (const ua of userActivity) {
      if (existingByEmail.has(ua.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(ua.user_email), ua);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create({ ...ua, created_by_id: user.id });
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

    return Response.json({ success: true, total: userActivity.length, created, updated, deleted, users: userActivity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});