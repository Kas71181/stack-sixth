import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ingestConnectorMembership } from '../../shared/evidenceIngestion.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a1db8b6d0e9930c01976399');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' };
    const members = [];
    let cursor = '';
    do {
      const url = new URL('https://api.notion.com/v1/users');
      url.searchParams.set('page_size', '100');
      if (cursor) url.searchParams.set('start_cursor', cursor);
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (!response.ok) return Response.json({ error: data.message || 'Notion member sync failed' }, { status: 400 });
      members.push(...(data.results || []).filter((item) => item.type === 'person').map((item) => ({ id: item.id, email: item.person?.email || null, name: item.name || item.person?.email || 'Notion member' })));
      cursor = data.has_more ? data.next_cursor || '' : '';
    } while (cursor);
    const evidence = await ingestConnectorMembership(base44, user, { appName: 'Notion', connectorType: 'notion', workspaceId: null, organizationVerified: false, capabilities: ['users'], seatAssignments: false, members, limitations: ['Workspace users are not verified paid seats', 'The API does not expose login activity', 'No inactivity or savings classification'] });
    return Response.json({ success: true, total: members.length, evidence_status: evidence.evidenceStatus, evidence_note: evidence.limitations.join('; '), evidence });
  } catch (error) {
    console.error('Notion evidence sync failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}