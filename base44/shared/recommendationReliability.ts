const normalize = (value) => String(value || '').trim().toLowerCase();
const cleanTool = (tool) => ({ name: normalize(tool.name || tool.tool_name), category: normalize(tool.category), monthlyCost: Number(tool.monthly_cost) || null, seats: Number(tool.licensed_seats) || null, lastVerified: tool.last_verified || tool.evidence_checked_at || null });

export function stableSnapshotHash(value) {
  const text = JSON.stringify(value); let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}

export function buildAuditSnapshot(audit, tools = audit.existing_software || []) {
  const normalized = tools.map(cleanTool).filter((tool) => tool.name).sort((a, b) => a.name.localeCompare(b.name));
  return { hash: stableSnapshotHash(normalized), capturedAt: new Date().toISOString(), tools: normalized };
}

export function validateDecisionInput(decision, details = {}) {
  if (!['approved', 'declined', 'deferred'].includes(decision)) throw new Error('Invalid recommendation decision');
  if (decision === 'declined' && details.reason && !['Recommendation not relevant', 'Current tool is required', 'Cost information incorrect', 'Usage information incorrect', 'Replacement unsuitable', 'Business requirement not understood', 'Other'].includes(details.reason)) throw new Error('Invalid decline reason');
  if (decision === 'deferred' && details.deferOption && !['30_days', '60_days_before_renewal', 'next_audit', 'custom_date'].includes(details.deferOption)) throw new Error('Invalid defer option');
  return true;
}

export function assertTenantRecord(record, userId) {
  if (!record || record.created_by_id !== userId) throw new Error('Record not found');
  return record;
}

export function hardenAnalysisResult(raw, audit, generatedAt = new Date().toISOString()) {
  const source = raw?.raw_ai_output || raw || {};
  const existing = audit.existing_software || [];
  const existingNames = new Map(existing.map((tool) => [normalize(tool.name), tool]));
  const context = [...(audit.business_processes || []).slice(0, 2), ...(audit.pain_points || []).slice(0, 1)];
  const persisted = raw?.recommendations || [];
  const recommendations = (source.recommendations || []).map((rec, index) => {
    const decision = persisted[index] || rec;
    const replacement = existingNames.get(normalize(rec.replacement_candidate_for));
    const basis = [];
    if (replacement) basis.push(`${replacement.name} is listed in this audit's software environment.`);
    context.forEach((item) => basis.push(`Customer context to validate: ${item}.`));
    if (!basis.length) basis.push('Product fit requires additional customer and product evidence.');
    return { ...rec, category: 'Candidate requiring validation', estimated_monthly_cost: null, match_score: null, match_status: 'insufficient_data', match_score_method: 'No score until functional fit 30%, requirements 20%, integrations 15%, cost 15%, migration 10%, and company/stack compatibility 10% have sufficient evidence.', why_it_fits: basis, integration_notes: [], savings_or_roi_note: 'Savings and ROI are unavailable until current cost, replacement cost, and implementation impact are verified.', estimated_savings_opportunity: null, migration_risk: 'unknown', implementation_priority: 'review', adopt_now_or_later: 'requires_validation', replacement_candidate_for: replacement?.name || null, evidence_status: 'INSUFFICIENT_EVIDENCE', validation_status: 'requires_revalidation', unsupported_claims_suppressed: ['pricing', 'match score', 'savings', 'ROI', 'integrations', 'migration complexity'], source_audit_id: audit.id, generated_at: generatedAt, decision_state: decision.decision_state, decision_reason: decision.decision_reason, defer_option: decision.defer_option, deferred_until: decision.deferred_until, decision_at: decision.decision_at, decision_by: decision.decision_by, savings_state: decision.savings_state || 'not_realized' };
  });
  return { ...source, summary: 'Candidate recommendations are advisory until customer requirements and verified product evidence are validated.', budget_fit: 'unknown', suggested_stack_total: null, quick_wins: [], recommendations, assumptions: ['Candidate names are advisory until product fit is validated. Unsupported financial, usage, integration, and migration claims are suppressed.'], evidence_snapshot: raw?.evidence_snapshot || buildAuditSnapshot(audit), raw_ai_output: raw?.raw_ai_output || source };
}

export function recommendationFreshness(snapshot, currentTools) {
  if (!snapshot?.hash) return { status: 'requires_revalidation', reason: 'This recommendation predates evidence snapshots.' };
  if (!currentTools?.length) return { status: 'current', reason: null };
  const current = buildAuditSnapshot({ existing_software: currentTools }, currentTools);
  return current.hash === snapshot.hash ? { status: 'current', reason: null } : { status: 'stale', reason: 'The current software environment differs from the audit snapshot.' };
}