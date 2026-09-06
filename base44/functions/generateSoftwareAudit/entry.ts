import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { hardenAnalysisResult } from '../../shared/recommendationReliability.ts';

const defaultPolicy = { minimum_match_score: 60, max_recommendations: 5, priority_order: ['savings', 'fit', 'integration', 'migration_risk'], guidance: [] };

const analysisSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' }, budget_fit: { type: 'string' }, suggested_stack_total: { type: 'number' },
    quick_wins: { type: 'array', items: { type: 'string' } }, assumptions: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, category: { type: 'string' }, estimated_monthly_cost: { type: 'number' }, match_score: { type: 'number' },
      why_it_fits: { type: 'array', items: { type: 'string' } }, integration_notes: { type: 'array', items: { type: 'string' } },
      savings_or_roi_note: { type: 'string' }, implementation_priority: { type: 'string' }, adopt_now_or_later: { type: 'string' },
      replacement_candidate_for: { type: 'string' }, estimated_savings_opportunity: { type: 'number' }, migration_risk: { type: 'string' }
    } } }
  }
};

export default async function(req) {
  let base44;
  let auditId;
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { audit_id } = await req.json();
    auditId = audit_id;
    if (!auditId) return Response.json({ error: 'audit_id is required' }, { status: 400 });
    const audit = await base44.entities.SoftwareAudit.get(auditId);
    if (!audit || audit.created_by_id !== user.id) return Response.json({ error: 'Audit not found' }, { status: 404 });

    let icpProfile = null;
    if (audit.company_website) {
      try {
        icpProfile = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Analyze this company's online presence and extract its business context. Company: ${audit.company_name}. Website: ${audit.company_website}. Return industry, business model, company stage, primary customers, key use cases, technical maturity, growth focus, and a concise summary.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: { type: 'object', properties: {
            industry: { type: 'string' }, business_model: { type: 'string' }, company_stage: { type: 'string' }, primary_customers: { type: 'string' },
            key_use_cases: { type: 'array', items: { type: 'string' } }, tech_maturity: { type: 'string' }, growth_focus: { type: 'string' }, summary: { type: 'string' }
          } }
        });
      } catch (error) {
        console.error('ICP enrichment failed', error);
      }
    }

    const models = await base44.entities.ContinuousLearningModel.filter({ status: 'active' }, '-version', 1);
    const model = models[0];
    const policy = model?.recommendation_policy || defaultPolicy;
    const input = {
      company_name: audit.company_name, company_website: audit.company_website || null, user_type: audit.user_type, team_size: audit.team_size,
      monthly_budget: audit.monthly_budget || null, business_processes: audit.business_processes || [], pain_points: audit.pain_points || [],
      existing_software: audit.existing_software || [], icp_profile: icpProfile
    };
    const rawResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are Stack Sixth. Return only JSON. Identify 3 to 5 software candidates for customer validation using only the supplied customer context. Do not invent or calculate pricing, savings, ROI, match scores, integrations, migration complexity, usage, compatibility, or contract terms. Candidate discovery is advisory; deterministic validation occurs after this response. Do not recommend exact duplicates unless identifying a possible replacement. Do not use em dashes.\n\nPolicy version ${model?.version || 'baseline'}: maximum ${policy.max_recommendations || 5}. ${(policy.guidance || []).join(' ')}\n\nInput:\n${JSON.stringify(input)}`,
      response_json_schema: analysisSchema
    });
    const result = hardenAnalysisResult(rawResult, audit);
    await base44.entities.SoftwareAudit.update(audit.id, { analysis_result: result, icp_profile: icpProfile, status: 'completed' });
    return Response.json({ success: true, audit_id: audit.id, status: 'completed' });
  } catch (error) {
    console.error('Software audit generation failed', error);
    try {
      if (base44 && auditId) await base44.entities.SoftwareAudit.update(auditId, { status: 'error' });
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
}