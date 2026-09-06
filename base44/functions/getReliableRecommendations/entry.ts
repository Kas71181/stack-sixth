import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { hardenAnalysisResult, recommendationFreshness } from '../../shared/recommendationReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { auditId } = await req.json().catch(() => ({}));
    const audits = auditId ? [await base44.entities.SoftwareAudit.get(auditId)] : await base44.entities.SoftwareAudit.filter({ created_by_id: user.id, status: 'completed' }, '-created_date', 1);
    const audit = audits[0];
    if (!audit) return Response.json({ audit: null });
    if (audit.created_by_id !== user.id) return Response.json({ error: 'Audit not found' }, { status: 404 });
    const currentStack = await base44.entities.SaasIntegration.filter({ created_by_id: user.id }, '-updated_date', 500);
    const hadSnapshot = !!audit.analysis_result?.evidence_snapshot;
    const analysis = hardenAnalysisResult(audit.analysis_result, audit);
    const freshness = hadSnapshot ? recommendationFreshness(analysis.evidence_snapshot, currentStack) : { status: 'requires_revalidation', reason: 'This recommendation predates evidence snapshots.' };
    analysis.recommendations = analysis.recommendations.map((rec) => ({ ...rec, freshness_status: freshness.status, freshness_reason: freshness.reason }));
    return Response.json({ audit: { ...audit, analysis_result: analysis }, freshness });
  } catch (error) {
    console.error('Reliable recommendations failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}