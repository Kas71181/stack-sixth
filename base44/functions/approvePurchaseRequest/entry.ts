import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user);
    if (!context?.isManager) return Response.json({ error: 'Company manager access required' }, { status: 403 });

    const { request_id, status, reviewer_note } = await req.json();
    if (!request_id || !status) return Response.json({ error: 'request_id and status are required' }, { status: 400 });
    if (!['approved', 'rejected', 'deferred'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });

    let request = null;
    try {
      request = await base44.asServiceRole.entities.PurchaseRequest.get(request_id);
    } catch {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }
    if (!request || request.company_id !== context.companyId) return Response.json({ error: 'Request not found' }, { status: 404 });
    if (request.requester_user_id === user.id || request.created_by_id === user.id) return Response.json({ error: 'Company managers cannot approve their own purchase requests' }, { status: 403 });

    const updated = await base44.asServiceRole.entities.PurchaseRequest.update(request.id, {
      status,
      reviewer: user.full_name || user.email,
      reviewer_note: reviewer_note || '',
    });
    await base44.asServiceRole.entities.AuditTrailEvent.create({
      entity_type: 'PurchaseRequest',
      entity_id: request.id,
      entity_label: request.tool_name,
      action: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'status_changed',
      actor_name: user.full_name || user.email,
      actor_email: user.email,
      old_value: request.status,
      new_value: status,
      note: reviewer_note || '',
      created_by_id: user.id,
    });

    return Response.json({ success: true, request: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}