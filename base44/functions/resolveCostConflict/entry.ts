import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { normalizeBilling } from '../../shared/evidenceEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { organizationAppId, financialRecordId } = await req.json();
    if (!organizationAppId || !financialRecordId) return Response.json({ error: 'Application and cost source are required' }, { status: 400 });
    const records = await base44.entities.FinancialRecord.filter({ organization_id: user.id, organization_app_id: organizationAppId });
    const selected = records.find((record) => record.id === financialRecordId);
    if (!selected) return Response.json({ error: 'Cost source not found' }, { status: 404 });
    const now = new Date().toISOString();
    await base44.entities.FinancialRecord.bulkUpdate(records.filter((record) => record.status !== 'superseded' || record.id === selected.id).map((record) => record.id === selected.id
      ? { id: record.id, authoritative: true, status: 'confirmed', resolved_by_user_id: user.id, resolved_by_email: user.email, resolved_at: now, resolution_note: 'Selected by customer as authoritative' }
      : { id: record.id, authoritative: false, status: 'superseded', superseded_at: now }
    ));
    const issues = await base44.asServiceRole.entities.ValidationIssue.filter({ organization_id: user.id, organization_app_id: organizationAppId, rule_code: 'COST_SOURCE_CONFLICT', resolved: false });
    if (issues.length) await base44.asServiceRole.entities.ValidationIssue.bulkUpdate(issues.map((issue) => ({ id: issue.id, resolved: true })));
    const normalized = normalizeBilling(selected);
    await base44.asServiceRole.entities.AuditTrailEvent.create({ entity_type: 'FinancialRecord', entity_id: selected.id, entity_label: selected.source_name || selected.record_type, action: 'updated', actor_name: user.full_name || '', actor_email: user.email || '', new_value: `${selected.currency || 'USD'} ${selected.amount} ${selected.billing_period || 'unknown'}`, note: 'Customer selected authoritative cost source', created_by_id: user.id });
    return Response.json({ success: true, financial_record_id: selected.id, monthly_amount: normalized.monthlyAmount, annual_amount: normalized.annualAmount, original_amount: selected.amount, billing_period: selected.billing_period, currency: selected.currency || 'USD', source: selected.source_name || selected.record_type, resolved_at: now });
  } catch (error) {
    console.error('Cost conflict resolution failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}