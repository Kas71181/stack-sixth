import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin access required to approve or reject requests' }, { status: 403 });

    const body = await req.json();
    const { request_id, status, reviewer_note } = body;

    if (!request_id || !status) {
      return Response.json({ error: 'request_id and status are required' }, { status: 400 });
    }

    const validStatuses = ['approved', 'rejected', 'deferred'];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.PurchaseRequest.update(request_id, {
      status,
      reviewer: user.full_name || user.email,
      reviewer_note: reviewer_note || '',
    });

    return Response.json({ success: true, request: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});