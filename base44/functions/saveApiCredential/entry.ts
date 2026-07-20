import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { encryptCredential } from '../../shared/credentialCrypto.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { service, api_key, extra_fields = {}, integration_id } = await req.json();
    if (!service || !api_key) return Response.json({ error: 'service and api_key are required' }, { status: 400 });
    const encrypted = await encryptCredential({ api_key, extra_fields });
    const data = {
      service, ...encrypted, token_last_four: api_key.slice(-4), encryption_version: 1,
      api_key: '', extra_fields: {},
    };
    const existing = await base44.entities.ApiCredential.filter({ service, created_by_id: user.id });
    if (existing.length > 0) await base44.entities.ApiCredential.update(existing[0].id, data);
    else await base44.entities.ApiCredential.create(data);

    if (integration_id) {
      await base44.entities.SaasIntegration.update(integration_id, {
        connection_status: 'Manual Auth', evidence_type: 'insufficient',
        evidence_checked_at: new Date().toISOString(),
        evidence_note: 'Encrypted API token stored; live access has not yet been verified',
      });
    }
    return Response.json({ success: true, token_last_four: data.token_last_four });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});