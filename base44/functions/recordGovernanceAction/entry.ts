import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';
import { governanceActor } from '../../shared/governanceReliability.ts';

const contractActions = new Set(['continue', 'renew', 'renegotiate', 'negotiate', 'cancel', 'replace']);
const integrationActions = new Set(['downgrade', 'cancel', 'dismiss']);
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me(); if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user); if (!context?.isManager) return Response.json({ error: 'Company manager access required' }, { status: 403 });
    const { entity_type, entity_id, action, details = {} } = await req.json(); const service = base44.asServiceRole.entities; const now = new Date().toISOString();
    if (entity_type === 'Contract') {
      if (!contractActions.has(action)) return Response.json({ error: 'Invalid contract action' }, { status: 400 });
      const record = await service.Contract.get(entity_id); const ownerId = context.company.owner_user_id || context.company.created_by_id;
      if (!record || !([context.companyId, undefined, null, ''].includes(record.company_id) && record.created_by_id === ownerId) && record.company_id !== context.companyId) return Response.json({ error: 'Contract not found' }, { status: 404 });
      const decision = action === 'renew' ? 'continue' : action === 'negotiate' ? 'renegotiate' : action;
      const updated = await service.Contract.update(record.id, { company_id: context.companyId, decision_state: decision, action_state: 'action_pending', action_type: action, action_requested_at: now, action_requested_by_user_id: user.id, action_requested_by_email: user.email, action_details: details, last_reviewed: now });
      await service.AuditTrailEvent.create({ company_id: context.companyId, entity_type: 'Contract', entity_id: record.id, entity_label: record.vendor_name, action: 'status_changed', ...governanceActor('USER', user), old_value: record.decision_state || 'undecided', new_value: decision, note: `Decision recorded; external action remains pending. ${details.note || ''}`.trim(), source: 'governance' });
      return Response.json({ success: true, record: updated, execution_verified: false });
    }
    if (entity_type === 'SaasIntegration') {
      if (!integrationActions.has(action)) return Response.json({ error: 'Invalid lifecycle action' }, { status: 400 });
      const record = await service.SaasIntegration.get(entity_id); if (!record || record.company_id !== context.companyId) return Response.json({ error: 'Application not found' }, { status: 404 });
      await service.AuditTrailEvent.create({ company_id: context.companyId, entity_type: 'SaasIntegration', entity_id: record.id, entity_label: record.tool_name, action: 'status_changed', ...governanceActor('USER', user), old_value: 'review_required', new_value: action, note: `Lifecycle decision recorded; external action remains unverified. ${details.reason || ''}`.trim(), source: 'governance' });
      return Response.json({ success: true, record, execution_verified: false });
    }
    return Response.json({ error: 'Invalid entity type' }, { status: 400 });
  } catch (error) { console.error('Governance action failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}