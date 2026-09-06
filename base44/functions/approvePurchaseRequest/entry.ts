import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';
import { governanceActor, validPurchaseTransition } from '../../shared/governanceReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me(); if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user); if (!context?.isManager) return Response.json({ error: 'Company manager access required' }, { status: 403 });
    const { request_id, status, reviewer_note } = await req.json(); if (!request_id || !['approved', 'rejected', 'deferred'].includes(status)) return Response.json({ error: 'Valid request_id and status are required' }, { status: 400 });
    const service = base44.asServiceRole.entities; let request; try { request = await service.PurchaseRequest.get(request_id); } catch { return Response.json({ error: 'Request not found' }, { status: 404 }); }
    if (!request || request.company_id !== context.companyId) return Response.json({ error: 'Request not found' }, { status: 404 });
    if (request.requester_user_id === user.id || request.created_by_id === user.id) return Response.json({ error: 'Company managers cannot approve their own purchase requests' }, { status: 403 });
    if (!validPurchaseTransition(request.status, status)) return Response.json({ error: `Invalid transition from ${request.status} to ${status}` }, { status: 409 });
    const now = new Date().toISOString(); const updated = await service.PurchaseRequest.update(request.id, { status, reviewer: user.full_name || user.email, reviewer_user_id: user.id, reviewed_at: now, reviewer_note: reviewer_note || '', execution_state: 'not_started', ...(status === 'approved' && request.requested_monthly_cost != null ? { approved_monthly_cost: request.requested_monthly_cost } : {}) });
    await service.AuditTrailEvent.create({ company_id: context.companyId, entity_type: 'PurchaseRequest', entity_id: request.id, entity_label: request.tool_name, action: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'status_changed', ...governanceActor('USER', user), old_value: request.status, new_value: status, note: reviewer_note || '', source: 'manager_decision' });
    return Response.json({ success: true, request: updated, purchased: false, provisioned: false });
  } catch (error) { console.error('Purchase approval failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}