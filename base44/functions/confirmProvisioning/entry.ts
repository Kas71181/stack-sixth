import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';
import { resolveCanonicalApp } from '../../shared/canonicalApps.ts';
import { governanceActor, validPurchaseTransition } from '../../shared/governanceReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me(); if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user); if (!context?.isManager) return Response.json({ error: 'Company manager access required' }, { status: 403 });
    const { request_id, confirmations } = await req.json(); if (!request_id || !['purchase', 'account', 'invite', 'integrate'].every((key) => confirmations?.[key] === true)) return Response.json({ error: 'All provisioning confirmations are required' }, { status: 400 });
    const service = base44.asServiceRole.entities; const request = await service.PurchaseRequest.get(request_id); if (!request || request.company_id !== context.companyId) return Response.json({ error: 'Request not found' }, { status: 404 });
    if (!validPurchaseTransition(request.status, 'provisioned')) return Response.json({ error: 'Only approved requests can be confirmed as provisioned' }, { status: 409 });
    const canonical = resolveCanonicalApp(request.tool_name); const integrations = await service.SaasIntegration.filter({ company_id: context.companyId }); const existing = integrations.find((item) => resolveCanonicalApp(item.tool_name).canonical_app_id === canonical.canonical_app_id);
    const integration = existing || await service.SaasIntegration.create({ company_id: context.companyId, tool_name: request.tool_name, category: request.category, connection_status: 'Pending', licensed_seats: request.requested_seats, evidence_type: 'observed', evidence_checked_at: new Date().toISOString(), evidence_note: `Provisioning confirmed by ${user.email} from purchase request ${request.id}.`, purchase_request_id: request.id, provisioning_status: 'user_confirmed' });
    const now = new Date().toISOString(); const updated = await service.PurchaseRequest.update(request.id, { status: 'provisioned', execution_state: 'verified', provisioning_confirmed_at: now, provisioning_confirmed_by_user_id: user.id, provisioning_confirmed_by_email: user.email, provisioned_integration_id: integration.id });
    await service.AuditTrailEvent.create({ company_id: context.companyId, entity_type: 'PurchaseRequest', entity_id: request.id, entity_label: request.tool_name, action: 'status_changed', ...governanceActor('USER', user), old_value: request.status, new_value: 'provisioned', note: 'Authorized user confirmed provisioning checklist completion.', source: 'user_confirmation' });
    return Response.json({ success: true, request: updated, integration, duplicate_suppressed: !!existing });
  } catch (error) { console.error('Provisioning confirmation failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}