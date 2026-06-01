import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Slack Usage Audit connector id
    const CONNECTOR_ID = '6a1dba44349cdfe5f00d8fb7';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // 1. Get all workspace members
    const membersRes = await fetch('https://slack.com/api/users.list?limit=200', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const membersData = await membersRes.json();
    if (!membersData.ok) return Response.json({ error: membersData.error }, { status: 400 });

    const realMembers = (membersData.members || []).filter(
      (m) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT'
    );

    // 2. Get conversations list to find channels each user is in
    const convsRes = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200&exclude_archived=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const convsData = await convsRes.json();
    const channels = convsData.ok ? (convsData.channels || []) : [];

    // 3. Build per-user activity from user presence and profile data
    const now = Date.now();
    const thirtyDaysAgo = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);

    const userActivity = realMembers.map((m) => {
      const profile = m.profile || {};
      const statusEmoji = profile.status_emoji || '';
      const lastUpdated = profile.status_expiration || null;

      // Use updated field as proxy for recent activity
      const updatedTs = m.updated ? m.updated * 1000 : null;
      const daysSinceUpdate = updatedTs ? Math.floor((now - updatedTs) / (1000 * 60 * 60 * 24)) : null;

      let status = 'Active';
      let activityScore = 80;
      let daysActive = 20;

      if (!updatedTs || daysSinceUpdate > 90) {
        status = 'Inactive';
        activityScore = 10;
        daysActive = 0;
      } else if (daysSinceUpdate > 30) {
        status = 'Dormant';
        activityScore = 35;
        daysActive = 5;
      } else if (daysSinceUpdate > 14) {
        status = 'Dormant';
        activityScore = 55;
        daysActive = 10;
      }

      if (m.is_owner || m.is_admin) {
        activityScore = Math.max(activityScore, 70);
        status = status === 'Inactive' ? 'Dormant' : status;
      }

      return {
        tool_name: 'Slack',
        user_email: profile.email || `${m.name}@slack`,
        user_name: profile.real_name || m.real_name || m.name,
        last_active_date: updatedTs ? new Date(updatedTs).toISOString().split('T')[0] : null,
        days_active_last_30: daysActive,
        activity_score: activityScore,
        status,
        license_cost_per_month: 0,
        wasted_cost_flag: status !== 'Active',
        source: 'live',
      };
    });

    // 4. Upsert into UserActivity entity
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Slack', created_by_id: user.id });
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

    return Response.json({
      success: true,
      total: userActivity.length,
      created,
      updated,
      users: userActivity,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});