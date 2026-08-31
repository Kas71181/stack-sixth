import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { confirm } = await req.json().catch(() => ({}));
    if (confirm !== true) return Response.json({ error: 'Confirmation is required' }, { status: 400 });
    const [integrations, companies] = await Promise.all([
      base44.entities.SaasIntegration.filter({ created_by_id: user.id }),
      base44.entities.Company.filter({ created_by_id: user.id })
    ]);
    if (!integrations.length) return Response.json({ error: 'Add software before running an audit' }, { status: 400 });
    const company = companies[0];
    const toolData = integrations.map((item) => ({
      name: item.tool_name, category: item.category, monthly_cost: item.monthly_cost, licensed_seats: item.licensed_seats,
      active_users: item.active_users, utilization: item.licensed_seats > 0 ? Math.round(((item.active_users || 0) / item.licensed_seats) * 100) : 0
    }));
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a SaaS spend auditor. Analyze the tool stack and return only JSON. Flag utilization below 50 percent, detect category redundancy, calculate monthly waste, produce 5 to 10 prioritized recommendations, an audit score from 0 to 100, and a concise executive summary.\n\nTool stack:\n${JSON.stringify(toolData)}`,
      response_json_schema: { type: 'object', properties: {
        audit_score: { type: 'number' }, executive_summary: { type: 'string' }, total_monthly_waste: { type: 'number' },
        inactive_seat_count: { type: 'number' }, redundant_tool_count: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'object', properties: {
          category: { type: 'string' }, tool_name: { type: 'string' }, description: { type: 'string' }, estimated_monthly_savings: { type: 'number' }, priority: { type: 'string' }
        } } }
      } }
    });
    const totalSpend = integrations.reduce((sum, item) => sum + (item.monthly_cost || 0), 0);
    const report = await base44.entities.AuditReport.create({
      company_id: company?.id || user.id, company_name: company?.name || 'My Company', generated_date: new Date().toISOString().split('T')[0],
      total_monthly_spend: totalSpend, estimated_monthly_waste: result.total_monthly_waste || 0,
      inactive_seat_count: result.inactive_seat_count || 0, redundant_tool_count: result.redundant_tool_count || 0,
      audit_score: result.audit_score || 0, executive_summary: result.executive_summary || '', status: 'Final'
    });
    const recommendations = (result.recommendations || []).map((item) => ({ ...item, audit_id: report.id, company_id: company?.id || user.id, status: 'Open' }));
    if (recommendations.length) await base44.entities.Recommendation.bulkCreate(recommendations);
    if (company?.id) await base44.entities.Company.update(company.id, { audit_score: result.audit_score, last_audit_date: new Date().toISOString().split('T')[0] });
    return Response.json({ success: true, report_id: report.id, recommendations_created: recommendations.length });
  } catch (error) {
    console.error('Usage audit report generation failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}