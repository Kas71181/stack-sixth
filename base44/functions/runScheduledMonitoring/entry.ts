import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called by scheduled automation — no user context, uses service role
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active monitors
    const monitors = await base44.asServiceRole.entities.ToolMonitor.filter({ is_active: true });
    const now = new Date();
    const reportPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const results = [];

    for (const monitor of monitors) {
      // Skip if a report for this period already exists
      const existing = await base44.asServiceRole.entities.ToolMonitor.filter({
        audit_id: monitor.audit_id,
        report_period: reportPeriod,
      });
      const alreadyRan = existing.some((r) => r.id !== monitor.id && r.status === 'generated');
      if (alreadyRan) {
        results.push({ audit_id: monitor.audit_id, skipped: true });
        continue;
      }

      const audit = await base44.asServiceRole.entities.SoftwareAudit.get(monitor.audit_id);
      if (!audit || audit.status !== 'completed') continue;

      const recommendations = audit.analysis_result?.recommendations || [];
      const existingSoftware = audit.existing_software || [];

      const toolsContext = recommendations.map((r, i) => ({
        name: r.name,
        category: r.category,
        monthly_cost: r.estimated_monthly_cost,
        savings_opportunity: r.estimated_savings_opportunity,
        decision: audit.analysis_result?.decisions?.[i] || 'pending',
      }));

      const prompt = `
You are a software spend intelligence system doing a scheduled monitoring check for ${audit.company_name}.
Team size: ${audit.team_size}, Monthly budget: $${audit.monthly_budget || 'unknown'}, Type: ${audit.user_type}.
Software stack: ${JSON.stringify(existingSoftware)}
Tool recommendations & decisions: ${JSON.stringify(toolsContext)}

Generate a concise monitoring report for period ${reportPeriod} including:
1. Stack health assessment
2. Adoption status of recommendations
3. Estimated waste or savings realized
4. 3–5 specific actionable recommendations
5. Risk flags for any tools

Respond as JSON:
{
  "report_summary": "string",
  "total_spend_estimate": number,
  "savings_realized": number,
  "new_savings_identified": number,
  "flagged_count": number,
  "recommendations": ["string"],
  "tools_snapshot": [{ "name": "string", "category": "string", "status": "adopted|pending|skipped|at_risk", "monthly_cost": number, "usage_score": number, "risk_flag": "string" }]
}`;

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
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
            tools_snapshot: { type: "array", items: { type: "object", properties: { name: { type: "string" }, category: { type: "string" }, status: { type: "string" }, monthly_cost: { type: "number" }, usage_score: { type: "number" }, risk_flag: { type: "string" } } } }
          }
        }
      });

      await base44.asServiceRole.entities.ToolMonitor.create({
        audit_id: monitor.audit_id,
        company_name: audit.company_name,
        report_period: reportPeriod,
        report_summary: result.report_summary,
        total_spend: result.total_spend_estimate,
        flagged_tools: result.flagged_count,
        savings_identified: result.new_savings_identified,
        recommendations: result.recommendations,
        tools_snapshot: result.tools_snapshot,
        is_active: false,
        status: 'generated',
      });

      results.push({ audit_id: monitor.audit_id, generated: true });
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});