import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';
import { resolveCanonicalApp } from '../../shared/canonicalApps.ts';
import { autoRenewalStatus, contractFingerprint, governanceActor, isDateOnly, renewalConflict, subtractNoticeDays, todayDateOnly, daysBetweenDateOnly } from '../../shared/governanceReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me(); if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user); if (!context) return Response.json({ error: 'Company setup required' }, { status: 400 });
    const body = await req.json(); const details = body.details || {}; const source = body.source;
    if (!['manual', 'contract', 'gmail'].includes(source) || !details.vendor_name) return Response.json({ error: 'Valid source and vendor_name are required' }, { status: 400 });
    if (details.renewal_date && !isDateOnly(details.renewal_date)) return Response.json({ error: 'Invalid renewal date' }, { status: 400 });
    const service = base44.asServiceRole.entities; const canonical = resolveCanonicalApp(details.canonical_app_id || details.vendor_name); const now = new Date().toISOString();
    const autoStatus = autoRenewalStatus(details); const noticeDays = details.notice_period_days === '' || details.notice_period_days == null ? null : Number(details.notice_period_days);
    if (noticeDays !== null && (!Number.isInteger(noticeDays) || noticeDays < 0 || noticeDays > 730)) return Response.json({ error: 'Invalid notice period' }, { status: 400 });
    const candidate = { ...details, company_id: context.companyId, canonical_app_id: canonical.canonical_app_id, renewal_source: source, renewal_source_record_id: details.source_record_id || '', renewal_source_label: details.source_label || (source === 'gmail' ? 'Gmail billing email' : source === 'contract' ? 'Uploaded contract' : 'Customer entry'), extraction_method: source === 'contract' ? 'AI extraction with customer confirmation' : source === 'gmail' ? 'deterministic email detection with customer confirmation' : 'customer entry', source_timestamp: details.source_timestamp || now, last_verified_at: now, verified_by_user_id: user.id, verified_by_email: user.email, verification_status: source === 'contract' ? 'verified' : 'customer_confirmed', needs_confirmation: false, auto_renewal_status: autoStatus, notice_deadline: subtractNoticeDays(details.renewal_date, noticeDays), decision_deadline: subtractNoticeDays(details.renewal_date, noticeDays), decision_state: details.decision_state || 'undecided', action_state: 'verified' };
    if (autoStatus !== 'unknown') candidate.auto_renews = autoStatus === 'yes';
    if (details.monthly_cost === '' || details.monthly_cost == null) delete candidate.monthly_cost; else candidate.monthly_cost = Number(details.monthly_cost);
    if (details.annual_cost === '' || details.annual_cost == null) delete candidate.annual_cost; else candidate.annual_cost = Number(details.annual_cost);
    candidate.source_fingerprint = contractFingerprint(candidate);
    const existing = await service.Contract.filter({ company_id: context.companyId });
    const duplicate = existing.find((item) => item.source_fingerprint === candidate.source_fingerprint);
    if (duplicate) return Response.json({ success: true, contract: duplicate, duplicate: true });
    const sameApp = existing.filter((item) => resolveCanonicalApp(item.canonical_app_id || item.vendor_name).canonical_app_id === canonical.canonical_app_id);
    const authoritativeConflict = sameApp.find((item) => ['verified', 'customer_confirmed'].includes(item.verification_status) && renewalConflict(item, candidate));
    if (authoritativeConflict) {
      const conflict = renewalConflict(authoritativeConflict, candidate); await service.Contract.update(authoritativeConflict.id, { evidence_conflicts: [...(authoritativeConflict.evidence_conflicts || []), ...conflict.map((item) => ({ ...item, source, source_record_id: candidate.renewal_source_record_id, detected_at: now }))], verification_status: 'needs_review' });
      await service.AuditTrailEvent.create({ company_id: context.companyId, entity_type: 'Contract', entity_id: authoritativeConflict.id, entity_label: authoritativeConflict.vendor_name, action: 'updated', ...governanceActor('USER', user), old_value: authoritativeConflict.renewal_date || 'unknown', new_value: candidate.renewal_date || 'unknown', note: 'Conflicting renewal evidence retained for review.', source });
      return Response.json({ success: false, conflict: true, contract: authoritativeConflict }, { status: 409 });
    }
    const days = candidate.renewal_date ? daysBetweenDateOnly(todayDateOnly(), candidate.renewal_date) : null; candidate.status = days === null ? 'Active' : days < 0 ? 'Expired' : days <= 60 ? 'Expiring Soon' : 'Active';
    const contract = await service.Contract.create(candidate);
    await service.AuditTrailEvent.create({ company_id: context.companyId, entity_type: 'Contract', entity_id: contract.id, entity_label: contract.vendor_name, action: 'created', ...governanceActor('USER', user), new_value: contract.renewal_date || 'unknown', note: `${source} renewal confirmed.`, source });
    return Response.json({ success: true, contract, duplicate: false });
  } catch (error) { console.error('Save governance contract failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}