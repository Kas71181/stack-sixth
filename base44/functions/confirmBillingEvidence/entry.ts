import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { candidate } = await req.json();
    if (!candidate?.vendor_name || !candidate?.source_type || !candidate?.source_record_id) return Response.json({ error: 'Complete evidence details are required' }, { status: 400 });
    const organizationId = user.id;
    const canonicalAppId = candidate.vendor_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const priorEvidence = await base44.entities.EvidenceRecord.filter({ organization_id: organizationId, source_type: candidate.source_type, source_record_id: candidate.source_record_id });
    if (priorEvidence.length) return Response.json({ success: true, duplicate: true });
    const apps = await base44.entities.OrganizationApp.filter({ organization_id: organizationId, canonical_app_id: canonicalAppId });
    const amount = Number(candidate.amount) || 0;
    const now = new Date().toISOString();
    const appData = { lifecycle_status: 'active', last_validated_at: now, ...(amount > 0 ? { financial_status: 'FINANCIAL_EVIDENCE' } : {}), ...(candidate.renewal_date ? { contract_status: 'CONTRACT_EVIDENCE' } : {}) };
    const app = apps[0] ? await base44.entities.OrganizationApp.update(apps[0].id, appData) : await base44.entities.OrganizationApp.create({ organization_id: organizationId, canonical_app_id: canonicalAppId, display_name: candidate.vendor_name, ownership_status: 'OBSERVED', access_status: 'INSUFFICIENT_EVIDENCE', usage_status: 'INSUFFICIENT_EVIDENCE', financial_status: amount > 0 ? 'FINANCIAL_EVIDENCE' : 'INSUFFICIENT_EVIDENCE', contract_status: candidate.renewal_date ? 'CONTRACT_EVIDENCE' : 'INSUFFICIENT_EVIDENCE', connected: false, organization_verified: false, ...appData });
    const metadata = { subject: candidate.subject, invoice_number: candidate.invoice_number, invoice_date: candidate.invoice_date, plan_name: candidate.plan_name, file_uri: candidate.file_uri, confidence: candidate.confidence, evidence_types: candidate.evidence_types };
    await base44.entities.EvidenceRecord.create({ organization_id: organizationId, organization_app_id: app.id, evidence_category: 'OWNERSHIP', evidence_status: 'OBSERVED', source_type: candidate.source_type, source_record_id: candidate.source_record_id, observed_at: now, freshness_status: 'fresh', verification_method: 'user_confirmed', derived_metadata: metadata });
    let financialRecord = null;
    if (amount > 0) {
      const evidence = await base44.entities.EvidenceRecord.create({ organization_id: organizationId, organization_app_id: app.id, evidence_category: 'FINANCIAL', evidence_status: 'FINANCIAL_EVIDENCE', source_type: candidate.source_type, source_record_id: `${candidate.source_record_id}:financial`, observed_at: now, valid_from: candidate.invoice_date ? new Date(candidate.invoice_date).toISOString() : now, freshness_status: 'fresh', verification_method: 'user_confirmed', derived_metadata: metadata });
      financialRecord = await base44.entities.FinancialRecord.create({ organization_id: organizationId, organization_app_id: app.id, record_type: 'invoice', amount, currency: candidate.currency || 'USD', billing_period: candidate.billing_period || candidate.billing_frequency || 'unknown', quantity: Number(candidate.quantity) || undefined, unit_price: Number(candidate.unit_price) || undefined, evidence_id: evidence.id, verified_at: now });
    }
    let contract = null;
    if (candidate.renewal_date) {
      await base44.entities.EvidenceRecord.create({ organization_id: organizationId, organization_app_id: app.id, evidence_category: 'CONTRACT', evidence_status: 'CONTRACT_EVIDENCE', source_type: candidate.source_type, source_record_id: `${candidate.source_record_id}:renewal`, observed_at: now, freshness_status: 'fresh', verification_method: 'user_confirmed', derived_metadata: metadata });
      const existing = await base44.entities.Contract.filter({ created_by_id: user.id, vendor_name: candidate.vendor_name });
      const contractData = { vendor_name: candidate.vendor_name, contract_name: candidate.plan_name || `${candidate.vendor_name} subscription`, renewal_date: candidate.renewal_date, billing_frequency: candidate.billing_frequency || 'unknown', renewal_source: candidate.source_type === 'gmail' ? 'gmail' : 'billing', renewal_confidence: Number(candidate.confidence) || 100, needs_confirmation: false, decision_state: 'undecided', status: 'Active' };
      contract = existing[0] ? await base44.entities.Contract.update(existing[0].id, contractData) : await base44.entities.Contract.create(contractData);
    }
    return Response.json({ success: true, application_id: app.id, financial_record_id: financialRecord?.id || null, contract_id: contract?.id || null });
  } catch (error) {
    console.error('Billing evidence confirmation failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}