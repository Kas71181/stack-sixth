import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ingestConnectorMembership } from '../../shared/evidenceIngestion.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Token vault first (our OAuth service on Vercel); Base44 managed connector as
    // fallback for users who connected before the custom flow shipped.
    let accessToken: string | undefined;
    const internalKey = Deno.env.get('INTERNAL_SYNC_KEY');
    if (internalKey) {
      const vaultResponse = await fetch('https://stacksixth.com/api/oauth/slack/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': internalKey },
        body: JSON.stringify({ app_user_id: user.id }),
      });
      if (vaultResponse.ok) accessToken = (await vaultResponse.json()).access_token;
    }
    if (!accessToken) {
      const connection = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a1dba44349cdfe5f00d8fb7');
      accessToken = connection.accessToken;
    }
    const headers = { Authorization: `Bearer ${accessToken}` };
    const authResponse = await fetch('https://slack.com/api/auth.test', { headers });
    const authData = await authResponse.json();
    if (!authData.ok) return Response.json({ error: authData.error || 'Slack authorization failed' }, { status: 400 });
    const members = [];
    let cursor = '';
    do {
      const url = new URL('https://slack.com/api/users.list');
      url.searchParams.set('limit', '200');
      if (cursor) url.searchParams.set('cursor', cursor);
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (!data.ok) return Response.json({ error: data.error || 'Slack member sync failed' }, { status: 400 });
      members.push(...(data.members || []).filter((item) => !item.is_bot && !item.deleted && item.id !== 'USLACKBOT').map((item) => ({ id: item.id, email: item.profile?.email || null, name: item.profile?.real_name || item.real_name || item.name })));
      cursor = data.response_metadata?.next_cursor || '';
    } while (cursor);
    const evidence = await ingestConnectorMembership(base44, user, { appName: 'Slack', connectorType: 'slack', workspaceId: authData.team_id, organizationVerified: true, capabilities: ['users', 'seat_assignments'], seatAssignments: true, members, limitations: ['Membership verifies assigned population only', 'No login or complete activity coverage', 'No inactivity or savings classification'] });
    return Response.json({ success: true, total: members.length, evidence_status: evidence.evidenceStatus, evidence_note: evidence.limitations.join('; '), evidence });
  } catch (error) {
    console.error('Slack evidence sync failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}