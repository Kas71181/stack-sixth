import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/requireAdmin.ts';

const baseline = {
  recommendation_policy: { minimum_match_score: 60, max_recommendations: 5, priority_order: ['savings', 'fit', 'integration', 'migration_risk'], guidance: [] },
  usage_policy: { dormancy_threshold_days: 60, low_activity_fraction: 0.5, minimum_observation_days: 60, guidance: [] },
  experience_policy: { insight_order: ['high-priority', 'total-waste', 'flagged-tools', 'compare-audits', 'benchmark'], max_suggested_actions: 4, guidance: [] }
};
const clamp = (value, min, max, fallback) => Math.min(max, Math.max(min, Number(value) || fallback));
const countBy = (items, value) => items.reduce((result, item) => { const key = value(item); if (key) result[key] = (result[key] || 0) + 1; return result; }, {});
const cleanGuidance = (items) => (Array.isArray(items) ? items : []).filter((item) => typeof item === 'string' && item.trim()).slice(0, 6).map((item) => item.slice(0, 240));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const access = await requireAdmin(base44);
    if (access.error) return access.error;
    const service = base44.asServiceRole.entities;
    const [audits, recommendations, seats, events, purchases, support, existingModels] = await Promise.all([
      service.SoftwareAudit.list('-updated_date', 500), service.Recommendation.list('-updated_date', 500),
      service.ApplicationSeat.list('-updated_date', 500), service.AcquisitionEvent.list('-occurred_at', 500),
      service.PurchaseRequest.list('-updated_date', 500), service.SupportConversation.list('-updated_date', 500),
      service.ContinuousLearningModel.list('-version', 50)
    ]);
    const auditDecisions = audits.flatMap((audit) => audit.analysis_result?.recommendations || []).map((item) => item.decision_state || item.approval_status).filter((item) => item && item !== 'undecided' && item !== 'none');
    const recommendationOutcomes = recommendations.map((item) => item.status).filter((item) => ['Completed', 'Dismissed'].includes(item));
    const purchaseOutcomes = purchases.map((item) => item.status).filter((item) => !['pending', 'auto_approved'].includes(item));
    const explicitSignals = auditDecisions.length + recommendationOutcomes.length + purchaseOutcomes.length;
    const outcomeSignals = seats.length + events.length + support.length;
    const signals = {
      explicit_total: explicitSignals, outcome_total: outcomeSignals,
      audit_decisions: countBy(auditDecisions, (item) => item), recommendation_outcomes: countBy(recommendationOutcomes, (item) => item),
      purchase_outcomes: countBy(purchaseOutcomes, (item) => item), usage_classifications: countBy(seats, (item) => item.usage_classification),
      usage_verified: countBy(seats, (item) => item.usage_verified ? 'verified' : 'unverified'), product_events: countBy(events, (item) => item.event_name),
      support_statuses: countBy(support, (item) => item.status)
    };
    const active = existingModels.find((item) => item.status === 'active');
    if (explicitSignals < 2 || explicitSignals + outcomeSignals < 10) {
      if (active) return Response.json({ success: true, updated: false, version: active.version, reason: 'Waiting for enough diverse feedback.' });
      const created = await service.ContinuousLearningModel.create({ version: 1, status: 'active', ...baseline, signal_counts: signals, quality_score: 100, guardrails_passed: true, summary: 'Safe baseline activated while the system gathers diverse feedback.', training_window_end: new Date().toISOString(), activated_at: new Date().toISOString() });
      return Response.json({ success: true, updated: true, version: created.version, baseline: true });
    }
    const previous = active || baseline;
    const proposal = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You tune Stack Sixth using aggregate, non-identifying feedback. Propose conservative policy updates that improve recommendations, usage intelligence, and product guidance. Never weaken evidence requirements. Do not infer facts beyond the counts. Preserve prior values when evidence is weak.\n\nPrevious policy:\n${JSON.stringify({ recommendation_policy: previous.recommendation_policy, usage_policy: previous.usage_policy, experience_policy: previous.experience_policy })}\n\nAggregate signals:\n${JSON.stringify(signals)}`,
      response_json_schema: { type: 'object', properties: {
        summary: { type: 'string' }, quality_score: { type: 'number' },
        recommendation_policy: { type: 'object', properties: { minimum_match_score: { type: 'number' }, max_recommendations: { type: 'number' }, priority_order: { type: 'array', items: { type: 'string' } }, guidance: { type: 'array', items: { type: 'string' } } } },
        usage_policy: { type: 'object', properties: { dormancy_threshold_days: { type: 'number' }, low_activity_fraction: { type: 'number' }, minimum_observation_days: { type: 'number' }, guidance: { type: 'array', items: { type: 'string' } } } },
        experience_policy: { type: 'object', properties: { insight_order: { type: 'array', items: { type: 'string' } }, max_suggested_actions: { type: 'number' }, guidance: { type: 'array', items: { type: 'string' } } } }
      } }
    });
    const allowedFactors = ['savings', 'fit', 'integration', 'migration_risk'];
    const allowedInsights = ['high-priority', 'total-waste', 'flagged-tools', 'compare-audits', 'benchmark'];
    const recommendationPolicy = {
      minimum_match_score: clamp(proposal.recommendation_policy?.minimum_match_score, 55, 85, previous.recommendation_policy.minimum_match_score),
      max_recommendations: Math.round(clamp(proposal.recommendation_policy?.max_recommendations, 3, 5, previous.recommendation_policy.max_recommendations)),
      priority_order: (proposal.recommendation_policy?.priority_order || []).filter((item) => allowedFactors.includes(item)).concat(allowedFactors).filter((item, index, array) => array.indexOf(item) === index).slice(0, 4),
      guidance: cleanGuidance(proposal.recommendation_policy?.guidance)
    };
    const usagePolicy = {
      dormancy_threshold_days: Math.round(clamp(proposal.usage_policy?.dormancy_threshold_days, 30, 120, previous.usage_policy.dormancy_threshold_days)),
      low_activity_fraction: clamp(proposal.usage_policy?.low_activity_fraction, 0.35, 0.75, previous.usage_policy.low_activity_fraction),
      minimum_observation_days: Math.round(clamp(proposal.usage_policy?.minimum_observation_days, 14, 120, previous.usage_policy.minimum_observation_days)),
      guidance: cleanGuidance(proposal.usage_policy?.guidance)
    };
    const experiencePolicy = {
      insight_order: (proposal.experience_policy?.insight_order || []).filter((item) => allowedInsights.includes(item)).concat(allowedInsights).filter((item, index, array) => array.indexOf(item) === index).slice(0, 5),
      max_suggested_actions: Math.round(clamp(proposal.experience_policy?.max_suggested_actions, 2, 4, previous.experience_policy.max_suggested_actions)),
      guidance: cleanGuidance(proposal.experience_policy?.guidance)
    };
    const now = new Date().toISOString();
    const archived = existingModels.filter((item) => item.status === 'active').map((item) => ({ id: item.id, status: 'archived' }));
    if (archived.length) await service.ContinuousLearningModel.bulkUpdate(archived);
    const created = await service.ContinuousLearningModel.create({ version: Math.max(0, ...existingModels.map((item) => Number(item.version) || 0)) + 1, status: 'active', training_window_start: existingModels[0]?.training_window_end, training_window_end: now, signal_counts: signals, recommendation_policy: recommendationPolicy, usage_policy: usagePolicy, experience_policy: experiencePolicy, quality_score: clamp(proposal.quality_score, 0, 100, 70), guardrails_passed: true, summary: String(proposal.summary || 'Policies updated from aggregate user feedback and outcomes.').slice(0, 500), activated_at: now });
    return Response.json({ success: true, updated: true, version: created.version, quality_score: created.quality_score, signal_counts: signals });
  } catch (error) {
    console.error('Continuous learning update failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}