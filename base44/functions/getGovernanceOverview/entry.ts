import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';
import { deduplicateContracts, daysBetweenDateOnly, isVerifiedRenewal, todayDateOnly } from '../../shared/governanceReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user); if (!context) return Response.json({ pending: 0, renewals: 0, unassigned: 0, decisions: 0 });
    const service = base44.asServiceRole.entities; const ownerId = context.company.owner_user_id || context.company.created_by_id;
    const [requests, scopedContracts, legacyContracts, scopedEvents, legacyEvents] = await Promise.all([
      service.PurchaseRequest.filter({ company_id: context.companyId }), service.Contract.filter({ company_id: context.companyId }), service.Contract.filter({ created_by_id: ownerId }), service.AuditTrailEvent.filter({ company_id: context.companyId }, '-created_date', 200), service.AuditTrailEvent.filter({ created_by_id: ownerId }, '-created_date', 200)
    ]);
    const contracts = deduplicateContracts([...scopedContracts, ...legacyContracts]); const events = [...new Map([...scopedEvents, ...legacyEvents].map((item) => [item.id, item])).values()]; const today = todayDateOnly();
    const activeRenewals = contracts.filter((item) => !['Cancelled', 'Expired'].includes(item.status) && isVerifiedRenewal(item));
    return Response.json({
      pending: requests.filter((item) => ['pending', 'auto_approved'].includes(item.status)).length,
      renewals: activeRenewals.filter((item) => { const days = daysBetweenDateOnly(today, item.renewal_date); return days !== null && days >= 0 && days <= 60; }).length,
      unassigned: activeRenewals.filter((item) => !item.governance_owner_email).length,
      decisions: events.filter((item) => ['approved', 'rejected', 'status_changed'].includes(item.action)).length,
      duplicate_contracts_suppressed: scopedContracts.length + legacyContracts.length - contracts.length
    });
  } catch (error) { console.error('Governance overview failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}