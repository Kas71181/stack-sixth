import { base44 } from "@/api/base44Client";

export const DEFAULT_LEARNING_POLICY = {
  recommendation_policy: { minimum_match_score: 60, max_recommendations: 5, priority_order: ["savings", "fit", "integration", "migration_risk"], guidance: [] },
  usage_policy: { dormancy_threshold_days: 60, low_activity_fraction: 0.5, minimum_observation_days: 60, guidance: [] },
  experience_policy: { insight_order: ["high-priority", "total-waste", "flagged-tools", "compare-audits", "benchmark"], max_suggested_actions: 4, guidance: [] },
};

export async function getActiveLearningPolicy() {
  const models = await base44.entities.ContinuousLearningModel.filter({ status: "active" }, "-version", 1);
  return models[0] || DEFAULT_LEARNING_POLICY;
}

export function recommendationPolicyPrompt(model) {
  const policy = model?.recommendation_policy || DEFAULT_LEARNING_POLICY.recommendation_policy;
  return `Validated learning policy, version ${model?.version || "baseline"}:\n- Return no more than ${policy.max_recommendations || 5} recommendations.\n- Prefer match scores of at least ${policy.minimum_match_score || 60} when evidence supports them.\n- Rank decision factors in this order: ${(policy.priority_order || []).join(", ")}.\n${(policy.guidance || []).map((item) => `- ${item}`).join("\n")}`;
}

export function rankExperienceInsights(insights, model) {
  const policy = model?.experience_policy || DEFAULT_LEARNING_POLICY.experience_policy;
  const order = policy.insight_order || [];
  return [...insights].sort((a, b) => {
    const ai = order.indexOf(a.id); const bi = order.indexOf(b.id);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  }).slice(0, policy.max_suggested_actions || 4);
}