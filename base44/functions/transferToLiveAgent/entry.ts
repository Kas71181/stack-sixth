import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const issueSummary = typeof payload.issue_summary === 'string' ? payload.issue_summary.trim().slice(0, 2000) : '';
    if (!issueSummary) return Response.json({ error: 'Issue summary is required' }, { status: 400 });

    const users = await base44.asServiceRole.entities.User.list('created_date', 100);
    const owner = users.find((candidate) => candidate.role === 'admin' && candidate.email);
    if (!owner) return Response.json({ error: 'No app owner is available for support' }, { status: 503 });

    const recentMessages = Array.isArray(payload.recent_messages) ? payload.recent_messages.slice(-12) : [];
    const transcript = recentMessages
      .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${String(message.content || '').slice(0, 1500)}`)
      .join('\n\n');
    const body = [
      'A Stack Sixth user needs help from a person.',
      '',
      `User: ${user.full_name || 'Unknown'}`,
      `Email: ${user.email || 'Not available'}`,
      `Page: ${String(payload.page || 'Unknown').slice(0, 200)}`,
      `Conversation ID: ${String(payload.conversation_id || 'Not available').slice(0, 200)}`,
      '',
      'Issue summary:',
      issueSummary,
      transcript ? `\nRecent conversation:\n${transcript}` : '',
      '',
      `Reply directly to ${user.email || 'the user'} to continue support.`,
    ].join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: owner.email,
      from_name: 'Stack Sixth Support',
      subject: `Human support request from ${user.full_name || user.email || 'a user'}`,
      body,
    });

    return Response.json({ success: true, message: 'The app owner has been notified.' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to transfer to support' }, { status: 500 });
  }
}