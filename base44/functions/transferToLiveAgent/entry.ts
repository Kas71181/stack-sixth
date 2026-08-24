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
    const transcript = recentMessages.map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${String(message.content || '').slice(0, 1500)}`).join('\n\n');
    const existing = await base44.entities.SupportConversation.filter({ requester_id: user.id }, '-created_date', 10);
    let supportConversation = existing.find((item) => item.status === 'waiting' || item.status === 'active');
    let created = false;

    if (!supportConversation) {
      supportConversation = await base44.entities.SupportConversation.create({
        requester_id: user.id,
        requester_name: user.full_name || user.email,
        requester_email: user.email,
        owner_id: owner.id,
        owner_name: owner.full_name || owner.email,
        issue_summary: issueSummary,
        page: String(payload.page || 'Unknown').slice(0, 200),
        assistant_conversation_id: String(payload.conversation_id || '').slice(0, 200),
        context_transcript: transcript,
        status: 'waiting',
        last_message_at: new Date().toISOString(),
      });
      await base44.entities.SupportMessage.create({
        conversation_id: supportConversation.id,
        members: [user.id, owner.id],
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        sender_role: 'system',
        content: 'Live support requested. The app owner has been notified and can join this chat.',
      });
      created = true;
    }

    if (created) {
      const chatUrl = `https://stack-sixth-spend.base44.app/support/${supportConversation.id}`;
      const body = [
        'A Stack Sixth user is waiting for you in live support.', '',
        `User: ${user.full_name || 'Unknown'}`, `Email: ${user.email || 'Not available'}`,
        `Page: ${String(payload.page || 'Unknown').slice(0, 200)}`, '',
        'Issue summary:', issueSummary, transcript ? `\nRecent assistant conversation:\n${transcript}` : '', '',
        `Open the live conversation: ${chatUrl}`,
      ].join('\n');
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: owner.email,
        from_name: 'Stack Sixth Support',
        subject: `Join live support with ${user.full_name || user.email || 'a user'}`,
        body,
      });
    }

    return Response.json({ success: true, support_conversation_id: supportConversation.id, message: 'Live support is ready.' });
  } catch (error) {
    console.error('transferToLiveAgent failed', error);
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to transfer to support' }, { status: 500 });
  }
}