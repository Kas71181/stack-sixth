import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const clientId = Deno.env.get('APOLLO_OAUTH_CLIENT_ID');
    const clientSecret = Deno.env.get('APOLLO_OAUTH_CLIENT_SECRET');
    if (!clientId || !clientSecret) return Response.json({ error: 'Apollo OAuth is not configured' }, { status: 500 });

    const requestUrl = new URL(req.url);
    requestUrl.search = '';
    const body = req.method === 'GET' ? {} : await req.json().catch(() => ({}));
    const callbackUrl = req.method === 'GET' ? requestUrl.toString() : body.callback_url;
    if (!callbackUrl || !callbackUrl.startsWith('https://') || !callbackUrl.endsWith('/functions/apolloOAuth')) {
      return Response.json({ error: 'A valid public Apollo callback URL is required' }, { status: 400 });
    }

    if (req.method === 'GET') {
      const code = new URL(req.url).searchParams.get('code');
      const state = new URL(req.url).searchParams.get('state');
      if (!code || !state) return new Response('Apollo authorization was cancelled.', { status: 400 });

      const [payloadPart, signaturePart] = state.split('.');
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(clientSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
      const signature = Uint8Array.from(atob(signaturePart.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
      const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(payloadPart));
      if (!valid) return new Response('Invalid authorization state.', { status: 400 });

      const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))));
      if (Date.now() - payload.createdAt > 10 * 60 * 1000) return new Response('Authorization request expired.', { status: 400 });

      const tokenRes = await fetch('https://app.apollo.io/api/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUrl }),
      });
      const tokens = await tokenRes.json();
      if (!tokenRes.ok || !tokens.access_token) return new Response(`Apollo authorization failed: ${tokens.error_description || tokens.error || 'token exchange failed'}`, { status: 400 });

      const existing = await base44.asServiceRole.entities.ApiCredential.filter({ service: 'apollo', created_by_id: payload.userId });
      const credential = {
        service: 'apollo',
        api_key: tokens.access_token,
        extra_fields: {
          auth_type: 'oauth',
          refresh_token: tokens.refresh_token || '',
          expires_at: new Date(Date.now() + (tokens.expires_in || 2592000) * 1000).toISOString(),
        },
      };
      if (existing[0]) await base44.asServiceRole.entities.ApiCredential.update(existing[0].id, credential);
      else await base44.asServiceRole.entities.ApiCredential.create({ ...credential, created_by_id: payload.userId });

      return new Response('<!doctype html><html><body style="font-family:system-ui;text-align:center;padding:48px"><h2>Apollo connected</h2><p>You can close this window.</p><script>window.close()</script></body></html>', { headers: { 'Content-Type': 'text/html' } });
    }

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const payloadPart = btoa(JSON.stringify({ userId: user.id, createdAt: Date.now() })).replace(/\+/g, '-').replace(/\//g, '_');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(clientSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadPart)));
    const signaturePart = btoa(String.fromCharCode(...signed)).replace(/\+/g, '-').replace(/\//g, '_');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      state: `${payloadPart}.${signaturePart}`,
    });
    return Response.json({ url: `https://app.apollo.io/#/oauth/authorize?${params.toString()}`, callback_url: callbackUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});