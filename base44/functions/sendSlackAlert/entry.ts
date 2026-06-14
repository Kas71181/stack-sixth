import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Sends a Slack alert message. Called from the frontend or automations.
// payload: { channel, message, blocks? }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { channel = '#general', message, blocks } = await req.json();
    if (!message && !blocks) return Response.json({ error: 'message required' }, { status: 400 });

    const stored = await base44.entities.ApiCredential.filter({ service: 'slack_bot', created_by_id: user.id });
    if (!stored[0]?.api_key) {
      return Response.json({ success: false, not_configured: true, error: 'Slack bot token not configured' });
    }

    const botToken = stored[0].api_key;
    const body = {
      channel,
      text: message,
      username: 'Stack Sixth',
      icon_emoji: ':bar_chart:',
    };
    if (blocks) body.blocks = blocks;

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!data.ok) {
      return Response.json({ success: false, error: data.error || 'Slack error' });
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});