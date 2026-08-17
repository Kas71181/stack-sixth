import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ingestConnectorMembership } from '../../shared/evidenceIngestion.ts';
import { ingestUsageEvents } from '../../shared/usageReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a1db9e6a90dd35761465e22');
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Stack-Sixth' };
    const organizationsResponse = await fetch('https://api.github.com/user/memberships/orgs?state=active&per_page=100', { headers });
    if (!organizationsResponse.ok) return Response.json({ error: `GitHub organization access failed (${organizationsResponse.status})` }, { status: 400 });
    const organizations = await organizationsResponse.json();
    const organization = organizations[0]?.organization || null;
    const members = [];
    if (organization) {
      let page = 1;
      while (true) {
        const response = await fetch(`https://api.github.com/orgs/${organization.login}/members?per_page=100&page=${page}`, { headers });
        if (!response.ok) return Response.json({ error: `GitHub member access failed (${response.status})` }, { status: 400 });
        const batch = await response.json();
        for (const item of batch) {
          const profileResponse = await fetch(`https://api.github.com/users/${item.login}`, { headers });
          const profile = profileResponse.ok ? await profileResponse.json() : item;
          members.push({ id: String(item.id), email: profile.email || null, name: profile.name || item.login, isBot: profile.type === 'Bot' });
        }
        if (batch.length < 100) break;
        page += 1;
      }
    } else {
      const profileResponse = await fetch('https://api.github.com/user', { headers });
      if (!profileResponse.ok) return Response.json({ error: `GitHub profile access failed (${profileResponse.status})` }, { status: 400 });
      const profile = await profileResponse.json();
      members.push({ id: String(profile.id), email: profile.email || null, name: profile.name || profile.login, isBot: profile.type === 'Bot' });
    }
    const limitations = organization ? ['Organization membership is Verified Access only', 'Live usage requires successful organization audit-log access', 'No inactivity conclusion without a complete observation window'] : ['Personal GitHub account link only', 'No organization seat population is available', 'No inactivity or savings classification'];
    const evidence = await ingestConnectorMembership(base44, user, { appName: 'GitHub', connectorType: 'github', workspaceId: organization ? String(organization.id) : `user:${members[0].id}`, organizationVerified: false, capabilities: organization ? ['users', 'seat_assignments'] : ['users'], seatAssignments: Boolean(organization), members, limitations });
    let activity = { available: false, eventsCreated: 0, reason: organization ? 'Organization audit permission unavailable' : 'Organization connection required' };
    if (organization) {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const auditEvents = [];
      let auditComplete = false;
      for (let page = 1; page <= 10; page += 1) {
        const auditUrl = new URL(`https://api.github.com/orgs/${organization.login}/audit-log`);
        auditUrl.searchParams.set('include', 'all');
        auditUrl.searchParams.set('order', 'desc');
        auditUrl.searchParams.set('per_page', '100');
        auditUrl.searchParams.set('page', String(page));
        auditUrl.searchParams.set('phrase', `created:>=${since}`);
        const auditResponse = await fetch(auditUrl, { headers });
        if (!auditResponse.ok) break;
        const batch = await auditResponse.json();
        auditEvents.push(...batch);
        if (batch.length < 100) { auditComplete = true; break; }
      }
      if (auditComplete) {
        const normalizeAction = (action = '') => action.includes('pull_request_review') ? 'pull_request_review' : action.includes('pull_request') ? 'pull_request' : action.includes('push') ? 'push' : action.includes('issue') ? 'issues' : action.includes('repo') ? 'repo_admin' : null;
        const qualifying = auditEvents.map((event) => ({ event, eventType: normalizeAction(event.action) })).filter((item) => item.eventType && item.event.actor_id);
        const usage = await ingestUsageEvents(base44, user, { provider: 'github', application: 'GitHub', providerDataCurrentThrough: new Date().toISOString(), syncStatus: 'succeeded', observationWindowDays: 30, events: qualifying.map(({ event, eventType }) => ({ providerEventId: event._document_id || event.request_id, providerUserId: String(event.actor_id), providerAppIdentifier: organization.login, eventType, occurredAt: typeof event.created_at === 'number' ? new Date(event.created_at * 1000).toISOString() : event.created_at, succeeded: true, metadata: { action: event.action, repository: event.repo } })) });
        const appRows = await base44.entities.OrganizationApp.filter({ organization_id: user.id, canonical_app_id: 'github' });
        const seats = appRows[0] ? await base44.entities.ApplicationSeat.filter({ organization_id: user.id, organization_app_id: appRows[0].id }) : [];
        if (seats.length) await base44.entities.ApplicationSeat.bulkUpdate(seats.map((seat) => ({ id: seat.id, usage_supported: true, observation_window_days: 30, activity_window_days: 30, sync_status: 'succeeded', data_freshness_status: 'fresh', data_freshness: 'fresh', last_successful_sync_at: new Date().toISOString(), provider_data_current_through: new Date().toISOString() })));
        activity = { available: true, eventsCreated: usage.created, duplicates: usage.duplicates, observationWindowDays: 30 };
      }
    }
    return Response.json({ success: true, total: members.length, organization: organization?.login || null, evidence_status: evidence.evidenceStatus, usage_status: activity.eventsCreated > 0 ? 'VERIFIED_LIVE' : 'INSUFFICIENT_EVIDENCE', activity, evidence_note: evidence.limitations.join('; '), evidence });
  } catch (error) {
    console.error('GitHub evidence sync failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}