import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrganizationContext, companyScope } from '../../shared/organizationContext.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tool_name, category, estimated_monthly_cost, requested_seats, justification, team_affected, use_case, vendor_url } = body;

    if (!tool_name || !category) {
      return Response.json({ error: 'tool_name and category are required' }, { status: 400 });
    }

    const context = await resolveOrganizationContext(base44, user);
    if (!context) return Response.json({ error: 'Complete company setup before submitting a purchase request' }, { status: 400 });
    const ownerId = context.company.owner_user_id || context.company.created_by_id;
    const [integrations, policies, rolePolicies] = await Promise.all([
      base44.asServiceRole.entities.SaasIntegration.filter({ company_id: context.companyId }),
      base44.asServiceRole.entities.PurchasePolicy.filter({ is_active: true, created_by_id: ownerId }),
      base44.asServiceRole.entities.RolePolicy.filter({ created_by_id: ownerId }),
    ]);

    const company = context.company;
    const monthlyBudget = company?.monthly_saas_budget || 0;
    const cost = estimated_monthly_cost || 0;
    const seats = requested_seats || 1;
    const totalCost = cost * seats;

    // ── 1. Redundancy check ──
    const existingInCategory = integrations.filter(
      (i) => i.category === category
    );
    const redundancyWarnings = [];
    if (existingInCategory.length > 0) {
      redundancyWarnings.push(
        `You already have ${existingInCategory.length} tool(s) in the "${category}" category: ${existingInCategory.map((i) => i.tool_name).join(', ')}`
      );
    }

    // ── 2. Budget impact ──
    const budgetImpactPct = monthlyBudget > 0 ? Math.round((totalCost / monthlyBudget) * 100) : 0;

    // ── 3. Policy evaluation ──
    const policy = policies[0] || {
      max_auto_approve_cost: 100,
      requires_manual_above: 500,
      blocked_categories: [],
      auto_approve_categories: [],
      max_budget_pct_per_request: 15,
      block_redundant_tools: true,
    };

    const conflictFlags = [];

    if (policy.blocked_categories?.includes(category)) {
      conflictFlags.push(`Category "${category}" is blocked by policy`);
    }
    if (budgetImpactPct > (policy.max_budget_pct_per_request || 15)) {
      conflictFlags.push(`Request consumes ${budgetImpactPct}% of monthly budget (max allowed: ${policy.max_budget_pct_per_request || 15}%)`);
    }
    if (totalCost > (policy.requires_manual_above || 500)) {
      conflictFlags.push(`Cost exceeds manual review threshold of $${policy.requires_manual_above || 500}/mo`);
    }
    if (policy.block_redundant_tools && existingInCategory.length > 0) {
      conflictFlags.push(`Redundant tool — existing tools in same category detected`);
    }

    // ── 4. Role policy check ──
    if (team_affected && rolePolicies.length > 0) {
      const matchingRole = rolePolicies.find((r) =>
        team_affected.toLowerCase().includes(r.role_name?.toLowerCase()?.split(' ')[0] || '')
      );
      if (matchingRole && matchingRole.blocked_tools) {
        const isBlocked = matchingRole.blocked_tools.some((t) =>
          tool_name.toLowerCase().includes(t.toLowerCase())
        );
        if (isBlocked) {
          conflictFlags.push(`Tool is blocked for role "${matchingRole.role_name}" by role policy`);
        }
      }
    }

    // ── 5. AI recommendation ──
    const hasBlockingFlags = conflictFlags.length > 0;
    const isUnderAutoThreshold = totalCost <= (policy.max_auto_approve_cost || 100);
    const isAutoApproveCategory = policy.auto_approve_categories?.includes(category);

    let aiRecommendation;
    if (hasBlockingFlags) {
      aiRecommendation = 'needs_review';
    } else if (isUnderAutoThreshold || isAutoApproveCategory) {
      aiRecommendation = 'approve';
    } else {
      aiRecommendation = 'needs_review';
    }

    // ── 6. LLM reasoning ──
    const llmPrompt = `You are Stack Sixth, an AI procurement advisor. A purchase request has been submitted. Provide a concise decision summary.

Request details:
- Tool: ${tool_name}
- Category: ${category}
- Monthly cost: $${cost}/seat × ${seats} seats = $${totalCost}/mo total
- Team affected: ${team_affected || 'Not specified'}
- Justification: ${justification || 'Not provided'}
- Use case: ${use_case || 'Not provided'}

Company context:
- Monthly SaaS budget: $${monthlyBudget.toLocaleString()}
- Budget impact: ${budgetImpactPct}%
- Existing tools in same category: ${existingInCategory.map((i) => i.tool_name).join(', ') || 'None'}
- Conflict flags: ${conflictFlags.join('; ') || 'None'}

AI recommendation: ${aiRecommendation}

Write a 2-3 sentence decision reason explaining why this request should be ${aiRecommendation === 'approve' ? 'auto-approved' : aiRecommendation === 'reject' ? 'rejected' : 'reviewed by a human'}. Be direct and specific. Reference the data above.`;

    let decisionReason;
    try {
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
      });
      decisionReason = typeof llmResult === 'string' ? llmResult : llmResult?.response || JSON.stringify(llmResult);
    } catch {
      decisionReason = aiRecommendation === 'approve'
        ? `Request is under the auto-approval cost threshold ($${policy.max_auto_approve_cost || 100}/mo), no redundancy conflicts detected, and within budget limits.`
        : `Request requires human review due to: ${conflictFlags.join('; ') || 'cost or category considerations'}.`;
    }

    const status = aiRecommendation === 'approve' ? 'auto_approved' : 'pending';
    const request = await base44.asServiceRole.entities.PurchaseRequest.create({
      ...companyScope(context),
      requester_user_id: user.id,
      requester_name: user.full_name || '',
      requester_email: user.email || '',
      tool_name,
      category,
      estimated_monthly_cost: cost,
      requested_seats: seats,
      justification: justification || '',
      team_affected: team_affected || '',
      use_case: use_case || '',
      vendor_url: vendor_url || '',
      status,
      ai_recommendation: aiRecommendation,
      decision_reason: decisionReason,
      conflict_flags: conflictFlags,
      redundancy_warnings: redundancyWarnings,
      budget_impact_pct: budgetImpactPct,
    });
    return Response.json({
      request,
      ai_recommendation: aiRecommendation,
      decision_reason: decisionReason,
      conflict_flags: conflictFlags,
      redundancy_warnings: redundancyWarnings,
      budget_impact_pct: budgetImpactPct,
      total_monthly_cost: totalCost,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});