import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { service, api_key, extra_fields } = await req.json();
    if (!service) return Response.json({ error: 'service is required' }, { status: 400 });

    // Upsert: one credential record per service (scoped to the user via created_by_id)
    const existing = await base44.entities.ApiCredential.filter({ service });
    if (existing.length > 0) {
      await base44.entities.ApiCredential.update(existing[0].id, { service, api_key, extra_fields });
    } else {
      await base44.entities.ApiCredential.create({ service, api_key, extra_fields });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});