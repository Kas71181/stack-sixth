import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const CONNECTOR_ID = '6a1db9e6a90dd35761465e22';
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Stack-Sixth',
    };

    // 1. Get authenticated user's orgs
    const orgsRes = await fetch('https://api.github.com/user/orgs', { headers });
    if (!orgsRes.ok) {
      const details = await orgsRes.text();
      return Response.json({ success: false, error: `GitHub access failed (${orgsRes.status}): ${details || 'Reconnect GitHub and approve organization access'}` }, { status: 200 });
    }
    const orgs = await orgsRes.json();

    let allMembers = [];

    // Team domain will be auto-detected after collecting member emails
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];

    if (Array.isArray(orgs) && orgs.length > 0) {
      // Use first org
      const org = orgs[0].login;

      // 2. Get org members
      const membersRes = await fetch(`https://api.github.com/orgs/${org}/members?per_page=100`, { headers });
      const members = await membersRes.json();

      if (Array.isArray(members)) {
        // 3. For each member, get their recent events to determine last activity
        const now = Date.now();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        for (const member of members.slice(0, 50)) { // cap at 50 to avoid rate limits
          const eventsRes = await fetch(`https://api.github.com/users/${member.login}/events/public?per_page=30`, { headers });
          const events = await eventsRes.json();

          const recentEvents = Array.isArray(events) ? events : [];
          const lastEvent = recentEvents[0];
          const lastActiveDate = lastEvent ? new Date(lastEvent.created_at) : null;
          const daysSinceActive = lastActiveDate
            ? Math.floor((now - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          const eventsLast30 = recentEvents.filter((e) => {
            return e.created_at && new Date(e.created_at) >= thirtyDaysAgo;
          }).length;

          let status = 'Active';
          let activityScore = 80;

          if (daysSinceActive === null || daysSinceActive > 90) {
            status = 'Inactive';
            activityScore = 5;
          } else if (daysSinceActive > 30) {
            status = 'Dormant';
            activityScore = 30;
          } else {
            activityScore = Math.min(100, 40 + eventsLast30 * 5);
          }

          // Get user email
          const profileRes = await fetch(`https://api.github.com/users/${member.login}`, { headers });
          const profile = await profileRes.json();

          const pushEvents = recentEvents.filter((e) => e.type === 'PushEvent').length;
          const prEvents = recentEvents.filter((e) => e.type === 'PullRequestEvent').length;
          const uniqueRepos = new Set(recentEvents.map((e) => e.repo?.name)).size;

          allMembers.push({
            tool_name: 'GitHub',
            user_email: profile.email || `${member.login}@github`,
            user_name: profile.name || member.login,
            last_active_date: lastActiveDate ? lastActiveDate.toISOString().split('T')[0] : null,
            days_active_last_30: eventsLast30,
            activity_score: activityScore,
            status,
            license_cost_per_month: 0,
            wasted_cost_flag: status !== 'Active',
            source: 'live',
            // Deep activity signals
            logins_last_30: Math.min(30, eventsLast30), // event days = login proxy
            features_used: uniqueRepos, // repos interacted with = feature breadth
            transactions_last_30: eventsLast30, // total events = transactions
            content_created_last_30: pushEvents + prEvents, // commits + PRs = content created
            api_calls_last_30: 0,
          });
        }
      }
    } else {
      // No org — get the authenticated user themselves
      const profileRes = await fetch('https://api.github.com/user', { headers });
      const profile = await profileRes.json();
      const eventsRes = await fetch(`https://api.github.com/users/${profile.login}/events?per_page=30`, { headers });
      const events = await eventsRes.json();
      const recentEvents = Array.isArray(events) ? events : [];
      const lastEvent = recentEvents[0];
      const now = Date.now();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const lastActiveDate = lastEvent ? new Date(lastEvent.created_at) : null;
      const daysSinceActive = lastActiveDate ? Math.floor((now - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const eventsLast30 = recentEvents.filter((e) => e.created_at && new Date(e.created_at) >= thirtyDaysAgo).length;

      const pushEvents = recentEvents.filter((e) => e.type === 'PushEvent').length;
      const prEvents = recentEvents.filter((e) => e.type === 'PullRequestEvent').length;
      const uniqueRepos = new Set(recentEvents.map((e) => e.repo?.name)).size;
      const soloStatus = daysSinceActive === null || daysSinceActive > 90 ? 'Inactive' : daysSinceActive > 30 ? 'Dormant' : 'Active';

      allMembers.push({
        tool_name: 'GitHub',
        user_email: profile.email || `${profile.login}@github`,
        user_name: profile.name || profile.login,
        last_active_date: lastActiveDate ? lastActiveDate.toISOString().split('T')[0] : null,
        days_active_last_30: eventsLast30,
        activity_score: Math.min(100, 40 + eventsLast30 * 5),
        status: soloStatus,
        license_cost_per_month: 0,
        wasted_cost_flag: soloStatus !== 'Active',
        source: 'live',
        logins_last_30: Math.min(30, eventsLast30),
        features_used: uniqueRepos,
        transactions_last_30: eventsLast30,
        content_created_last_30: pushEvents + prEvents,
        api_calls_last_30: 0,
      });
    }

    // Auto-detect team domain from collected member emails
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    let teamDomain = (userDomain && !freeProviders.includes(userDomain)) ? userDomain : null;
    if (!teamDomain && allMembers.length > 0) {
      const domainCounts = {};
      for (const m of allMembers) {
        const email = m.user_email?.toLowerCase();
        if (!email) continue;
        const domain = email.split('@')[1];
        if (domain && !freeProviders.includes(domain)) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
      const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) teamDomain = sorted[0][0];
    }
    if (teamDomain) {
      const domainMatches = allMembers.filter((m) => m.user_email?.toLowerCase().endsWith('@' + teamDomain));
      if (domainMatches.length > 0) allMembers = domainMatches;
    }

    // Upsert into UserActivity
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'GitHub', created_by_id: user.id });
    const existingByEmail = new Map(existing.map((e) => [e.user_email, e.id]));

    let created = 0, updated = 0, deleted = 0;
    const syncedEmails = new Set(allMembers.map((ua) => ua.user_email));
    for (const ua of allMembers) {
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

    return Response.json({ success: true, total: allMembers.length, created, updated, deleted, users: allMembers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});