import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { audit_id } = await req.json();
    if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 });

    const audit = await base44.entities.SoftwareAudit.get(audit_id);
    if (!audit) return Response.json({ error: 'Audit not found' }, { status: 404 });
    if (audit.created_by !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const recommendations = audit.analysis_result?.recommendations || [];
    const existingSoftware = audit.existing_software || [];
    const now = new Date();
    const reportPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const toolsContext = recommendations.map((r) => ({
      name: r.name,
      category: r.category,
      monthly_cost: r.estimated_monthly_cost,
      savings_opportunity: r.estimated_savings_opportunity,
      priority: r.implementation_priority,
      adopt: r.adopt_now_or_later,
      decision: audit.analysis_result?.decisions?.[recommendations.indexOf(r)] || 'pending',
    }));

    const prompt = `
You are a software spend intelligence system doing a periodic monitoring check for ${audit.company_name}.

Company profile:
- Team size: ${audit.team_size}
- Monthly budget: $${audit.monthly_budget || 'unknown'}
- Business type: ${audit.user_type}

Current software stack: ${JSON.stringify(existingSoftware)}

Previously recommended tools with their current adoption decisions:
${JSON.stringify(toolsContext, null, 2)}

Generate a concise monitoring report for period ${reportPeriod} that includes:
1. Overall stack health assessment
2. Which recommended tools have been adopted vs pending vs skipped
3. Estimated current monthly waste or savings realized
4. 3–5 specific actionable recommendations for this period
5. Any tools showing risk flags (e.g. still paying for a tool that was recommended to drop, duplicates persisting, budget overrun)

Respond as JSON matching this schema:
{
  "report_summary": "2–3 sentence executive summary",
  "total_spend_estimate": number (estimated current monthly spend),
  "savings_realized": number (estimated monthly savings already captured),
  "new_savings_identified": number (additional savings still available),
  "flagged_count": number,
  "recommendations": ["string", "string", "string"],
  "tools_snapshot": [
    {
      "name": "string",
      "category": "string",
      "status": "adopted|pending|skipped|at_risk",
      "monthly_cost": number,
      "usage_score": number (0-100, estimated utilization),
      "risk_flag": "string or empty"
    }
  ]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          report_summary: { type: "string" },
          total_spend_estimate: { type: "number" },
          savings_realized: { type: "number" },
          new_savings_identified: { type: "number" },
          flagged_count: { type: "number" },
          recommendations: { type: "array", items: { type: "string" } },
          tools_snapshot: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                status: { type: "string" },
                monthly_cost: { type: "number" },
                usage_score: { type: "number" },
                risk_flag: { type: "string" }
              }
            }
          }
        }
      }
    });

    const report = await base44.entities.ToolMonitor.create({
      audit_id,
      company_name: audit.company_name,
      report_period: reportPeriod,
      report_summary: result.report_summary,
      total_spend: result.total_spend_estimate,
      flagged_tools: result.flagged_count,
      savings_identified: result.new_savings_identified,
      recommendations: result.recommendations,
      tools_snapshot: result.tools_snapshot,
      status: 'generated',
    });

    // Send email notification to the audit owner
    const savingsText = result.new_savings_identified > 0
      ? `\n\n💰 New savings identified: $${result.new_savings_identified}/mo`
      : '';
    const flagsText = result.flagged_count > 0
      ? `\n⚠️ Flagged tools: ${result.flagged_count}`
      : '';

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Stack Sixth: Monthly Report Ready — ${audit.company_name} (${reportPeriod})`,
      body: `Hi ${user.full_name || 'there'},\n\nYour monthly stack monitoring report for ${audit.company_name} is ready.\n\n${result.report_summary}${savingsText}${flagsText}\n\nView the full report in your Stack Sixth dashboard.\n\n— Stack Sixth AI`,
    });

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});