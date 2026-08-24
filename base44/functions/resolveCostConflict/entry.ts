import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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
      ? { id: record.id, authoritative: true, status: 'confirmed' }
      : { id: record.id, authoritative: false, status: 'superseded', superseded_at: now }
    ));
    const issues = await base44.asServiceRole.entities.ValidationIssue.filter({ organization_id: user.id, organization_app_id: organizationAppId, rule_code: 'COST_SOURCE_CONFLICT', resolved: false });
    if (issues.length) await base44.asServiceRole.entities.ValidationIssue.bulkUpdate(issues.map((issue) => ({ id: issue.id, resolved: true })));
    return Response.json({ success: true, financial_record_id: selected.id, monthly_amount: selected.amount, source: selected.source_name || selected.record_type });
  } catch (error) {
    console.error('Cost conflict resolution failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}