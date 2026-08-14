import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ingestConnectorMembership } from '../../shared/evidenceIngestion.ts';

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
          members.push({ id: String(item.id), email: profile.email || null, name: profile.name || item.login });
        }
        if (batch.length < 100) break;
        page += 1;
      }
    } else {
      const profileResponse = await fetch('https://api.github.com/user', { headers });
      if (!profileResponse.ok) return Response.json({ error: `GitHub profile access failed (${profileResponse.status})` }, { status: 400 });
      const profile = await profileResponse.json();
      members.push({ id: String(profile.id), email: profile.email || null, name: profile.name || profile.login });
    }
    const limitations = organization ? ['Organization membership is not billing entitlement', 'Public events do not provide complete activity coverage', 'No inactivity or savings classification'] : ['Personal GitHub account link only', 'No organization seat population is available', 'No inactivity or savings classification'];
    const evidence = await ingestConnectorMembership(base44, user, { appName: 'GitHub', connectorType: 'github', workspaceId: organization ? String(organization.id) : `user:${members[0].id}`, organizationVerified: false, capabilities: organization ? ['users', 'seat_assignments'] : ['users'], seatAssignments: Boolean(organization), members, limitations });
    return Response.json({ success: true, total: members.length, organization: organization?.login || null, evidence_status: evidence.evidenceStatus, evidence_note: evidence.limitations.join('; '), evidence });
  } catch (error) {
    console.error('GitHub evidence sync failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}