import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';
import { deduplicateContracts } from '../../shared/governanceReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me(); if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user); if (!context) return Response.json({ records: [] }); const { type, entity_type, entity_id } = await req.json().catch(() => ({})); const service = base44.asServiceRole.entities; const ownerId = context.company.owner_user_id || context.company.created_by_id;
    if (type === 'contracts') { const [scoped, legacy] = await Promise.all([service.Contract.filter({ company_id: context.companyId }, 'renewal_date', 100), service.Contract.filter({ created_by_id: ownerId }, 'renewal_date', 100)]); return Response.json({ records: deduplicateContracts([...scoped, ...legacy]) }); }
    if (type === 'history') { const [scoped, legacy] = await Promise.all([service.AuditTrailEvent.filter({ company_id: context.companyId, ...(entity_type ? { entity_type } : {}), ...(entity_id ? { entity_id } : {}) }, '-created_date', 100), service.AuditTrailEvent.filter({ created_by_id: ownerId, ...(entity_type ? { entity_type } : {}), ...(entity_id ? { entity_id } : {}) }, '-created_date', 100)]); const records = [...new Map([...scoped, ...legacy].map((item) => [item.id, item])).values()].sort((a,b) => String(b.created_date).localeCompare(String(a.created_date))).slice(0,100); return Response.json({ records }); }
    return Response.json({ error: 'Invalid record type' }, { status: 400 });
  } catch (error) { console.error('Governance records failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}