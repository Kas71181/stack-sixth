import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Passive app discovery via Google Workspace Admin SDK.
// Lists all third-party OAuth apps that have been granted access across the org.
// Requires a Service Account with domain-wide delegation and the Admin SDK scope.
// This replaces the need for a browser extension — it finds every shadow IT app at once.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stored = await base44.entities.ApiCredential.filter({ service: 'google_workspace', created_by_id: user.id });
    if (!stored[0]?.api_key || !stored[0]?.extra_fields?.admin_email) {
      return Response.json({ success: false, not_configured: true, error: 'Google Workspace credentials not configured' });
    }

    const serviceAccountKey = JSON.parse(stored[0].api_key);
    const adminEmail = stored[0].extra_fields.admin_email;

    // Build JWT for service account impersonation
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const jwtClaims = btoa(JSON.stringify({
      iss: serviceAccountKey.client_email,
      sub: adminEmail,
      scope: 'https://www.googleapis.com/auth/admin.reports.audit.readonly https://www.googleapis.com/auth/admin.directory.user.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }));

    // Sign with RSA private key
    const privateKeyPem = serviceAccountKey.private_key;
    const keyData = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');
    const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', binaryKey.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );
    const sigInput = new TextEncoder().encode(`${jwtHeader}.${jwtClaims}`);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, sigInput);
    const jwtSig = btoa(String.fromCharCode(...new Uint8Array(sig)));
    const jwt = `${jwtHeader}.${jwtClaims}.${jwtSig}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      return Response.json({ success: false, error: `Token exchange failed: ${err.error_description || tokenRes.status}` });
    }
    const { access_token } = await tokenRes.json();
    const authHeaders = { Authorization: `Bearer ${access_token}` };

    // Query Admin Reports API — token audit for OAuth app authorizations
    const appsRes = await fetch(
      `https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/token?maxResults=1000`,
      { headers: authHeaders }
    );

    if (!appsRes.ok) {
      const hint = appsRes.status === 403
        ? 'Domain-wide delegation not configured. See setup instructions.'
        : `Admin API error (${appsRes.status})`;
      return Response.json({ success: false, error: hint });
    }

    const appsData = await appsRes.json();
    const events = appsData.items || [];

    // Extract unique apps from token grant events
    const appMap = new Map(); // app_name -> { users: Set, first_seen, last_seen, scopes }
    for (const item of events) {
      for (const event of item.events || []) {
        if (event.type !== 'auth') continue;
        const params = Object.fromEntries((event.parameters || []).map((p) => [p.name, p.value || p.multiValue?.join(', ')]));
        const appName = params['app_name'];
        const userEmail = item.actor?.email;
        if (!appName || !userEmail) continue;

        if (!appMap.has(appName)) {
          appMap.set(appName, { users: new Set(), scopes: params['scope'] || '', first_seen: item.id?.time, last_seen: item.id?.time });
        }
        const entry = appMap.get(appName);
        entry.users.add(userEmail);
        if (item.id?.time > entry.last_seen) entry.last_seen = item.id.time;
      }
    }

    // Convert discovered apps to SaasIntegration records (shadow IT candidates)
    const discovered = [];
    for (const [appName, data] of appMap) {
      discovered.push({
        tool_name: appName,
        category: 'Dev Tools', // default — AI will recategorize
        connection_status: 'Connected',
        active_users: data.users.size,
        notes: `Discovered via Google Workspace OAuth audit. Scopes: ${data.scopes.substring(0, 200)}`,
      });
    }

    // Upsert discovered tools into SaasIntegration
    const existing = await base44.entities.SaasIntegration.filter({ created_by_id: user.id });
    const existingByName = new Map(existing.map((e) => [e.tool_name.toLowerCase(), e.id]));

    let created = 0, updated = 0;
    for (const tool of discovered) {
      const key = tool.tool_name.toLowerCase();
      if (existingByName.has(key)) {
        await base44.entities.SaasIntegration.update(existingByName.get(key), { active_users: tool.active_users, connection_status: 'Connected' });
        updated++;
      } else {
        await base44.entities.SaasIntegration.create({ ...tool, created_by_id: user.id });
        created++;
      }
    }

    return Response.json({ success: true, total: discovered.length, created, updated, apps: discovered.slice(0, 20) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}