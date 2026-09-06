import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { assertTenantRecord, validateDecisionInput } from '../../shared/recommendationReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { auditId, recommendationIndex, decision, details = {} } = await req.json();
    if (!auditId || !Number.isInteger(recommendationIndex)) return Response.json({ error: 'Audit and recommendation are required' }, { status: 400 });
    validateDecisionInput(decision, details);
    const audit = assertTenantRecord(await base44.entities.SoftwareAudit.get(auditId), user.id);
    const recommendations = [...(audit.analysis_result?.recommendations || [])];
    if (!recommendations[recommendationIndex]) return Response.json({ error: 'Recommendation not found' }, { status: 404 });
    const now = new Date().toISOString();
    const prior = recommendations[recommendationIndex].decision_state || 'none';
    recommendations[recommendationIndex] = { ...recommendations[recommendationIndex], decision_state: decision, decision_reason: details.reason || null, defer_option: details.deferOption || null, deferred_until: details.customDate || null, decision_at: now, decision_by: user.id, savings_state: recommendations[recommendationIndex].savings_state || 'not_realized' };
    await base44.entities.SoftwareAudit.update(audit.id, { analysis_result: { ...audit.analysis_result, recommendations } });
    await base44.asServiceRole.entities.AuditTrailEvent.create({ entity_type: 'Recommendation', entity_id: `${audit.id}:${recommendationIndex}`, entity_label: recommendations[recommendationIndex].name, action: decision === 'approved' ? 'approved' : decision === 'declined' ? 'rejected' : 'status_changed', actor_name: user.full_name || '', actor_email: user.email || '', old_value: prior, new_value: decision, note: details.reason || details.deferOption || '', created_by_id: user.id });
    return Response.json({ success: true, decision, decision_at: now, recommendation: recommendations[recommendationIndex] });
  } catch (error) {
    console.error('Recommendation decision failed', error);
    const status = error.message === 'Record not found' ? 404 : 400;
    return Response.json({ error: error.message }, { status });
  }
}