import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const CONNECTOR_ID = '6a1dba44349cdfe5f00d8fb7';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    const headers = { Authorization: `Bearer ${accessToken}` };

    // 1. Get all real workspace members
    const membersRes = await fetch('https://slack.com/api/users.list?limit=200', { headers });
    const membersData = await membersRes.json();
    if (!membersData.ok) return Response.json({ error: membersData.error }, { status: 400 });

    const allRealMembers = (membersData.members || []).filter(
      (m) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT'
    );

    // Auto-detect team: filter to members sharing the authenticated user's email domain
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    const shouldFilter = userDomain && !freeProviders.includes(userDomain);
    const realMembers = shouldFilter
      ? allRealMembers.filter((m) => {
          const email = m.profile?.email?.toLowerCase();
          return email && email.endsWith('@' + userDomain);
        })
      : allRealMembers;

    // Build user map: id -> member
    const memberMap = new Map(realMembers.map((m) => [m.id, m]));

    // 2. Get all public channels
    const convsRes = await fetch('https://slack.com/api/conversations.list?types=public_channel&limit=200&exclude_archived=true', { headers });
    const convsData = await convsRes.json();
    const channels = convsData.ok ? (convsData.channels || []) : [];

    // 3. Count messages per user in last 30 days across all channels
    const now = Date.now();
    const thirtyDaysAgo = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
    const messageCounts = new Map(); // userId -> { messageCount, lastActiveTs }
    const activeDays = new Map(); // userId -> Set of date strings

    for (const channel of channels.slice(0, 30)) { // cap at 30 channels to avoid rate limits
      const histRes = await fetch(
        `https://slack.com/api/conversations.history?channel=${channel.id}&oldest=${thirtyDaysAgo}&limit=200`,
        { headers }
      );
      const histData = await histRes.json();
      if (!histData.ok) continue;

      for (const msg of histData.messages || []) {
        if (!msg.user || msg.subtype) continue; // skip bot/system messages
        const uid = msg.user;
        const ts = parseFloat(msg.ts) * 1000;
        const dateStr = new Date(ts).toISOString().split('T')[0];

        messageCounts.set(uid, {
          messageCount: (messageCounts.get(uid)?.messageCount || 0) + 1,
          lastActiveTs: Math.max(messageCounts.get(uid)?.lastActiveTs || 0, ts),
        });

        if (!activeDays.has(uid)) activeDays.set(uid, new Set());
        activeDays.get(uid).add(dateStr);
      }
    }

    // 4. Build activity records per user
    const userActivity = realMembers.map((m) => {
      const profile = m.profile || {};
      const msgData = messageCounts.get(m.id);
      const msgCount = msgData?.messageCount || 0;
      const lastActiveTs = msgData?.lastActiveTs || null;
      const uniqueDaysActive = activeDays.get(m.id)?.size || 0;

      let status, activityScore, daysActive;

      if (msgCount === 0) {
        // No messages in 30 days — check if they're just a lurker or truly inactive
        // Fall back to profile update time as a weak signal
        const updatedTs = m.updated ? m.updated * 1000 : null;
        const daysSinceUpdate = updatedTs ? Math.floor((now - updatedTs) / (1000 * 60 * 60 * 24)) : 999;
        if (daysSinceUpdate > 90) {
          status = 'Inactive';
          activityScore = 5;
          daysActive = 0;
        } else {
          status = 'Dormant';
          activityScore = 15;
          daysActive = 0;
        }
      } else {
        daysActive = uniqueDaysActive;
        activityScore = Math.min(100, 20 + msgCount * 2 + uniqueDaysActive * 3);
        status = 'Active';
      }

      const lastActiveDateStr = lastActiveTs
        ? new Date(lastActiveTs).toISOString().split('T')[0]
        : (m.updated ? new Date(m.updated * 1000).toISOString().split('T')[0] : null);

      return {
        tool_name: 'Slack',
        user_email: profile.email || `${m.name}@slack`,
        user_name: profile.real_name || m.real_name || m.name,
        last_active_date: lastActiveDateStr,
        days_active_last_30: daysActive,
        activity_score: activityScore,
        status,
        license_cost_per_month: 0,
        wasted_cost_flag: status !== 'Active',
        source: 'live',
        // Deep activity signals
        logins_last_30: daysActive, // proxy: days with activity = days they logged in
        features_used: msgCount > 0 ? Math.min(5, 1 + Math.floor(msgCount / 10)) : 0, // channels/features engaged
        transactions_last_30: msgCount, // messages sent = primary transaction
        content_created_last_30: msgCount, // messages = content created
        api_calls_last_30: 0, // not applicable for end-users in Slack
      };
    });

    // 5. Upsert into UserActivity entity
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Slack', created_by_id: user.id });
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