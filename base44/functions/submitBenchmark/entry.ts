import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Called after an audit completes — anonymizes and contributes data to the benchmark pool
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { integrations, company_size } = await req.json();
    if (!integrations || !Array.isArray(integrations)) {
      return Response.json({ error: 'integrations array required' }, { status: 400 });
    }

    let contributed = 0;
    for (const tool of integrations) {
      if (!tool.tool_name) continue;
      const utilRate = tool.licensed_seats > 0 ? (tool.active_users || 0) / tool.licensed_seats : null;

      // Check if benchmark entry exists for this tool + size combo
      const existing = await base44.asServiceRole.entities.BenchmarkData.filter({
        tool_name: tool.tool_name,
        company_size_range: company_size || '11-50',
      });

      if (existing.length > 0) {
        const b = existing[0];
        const n = (b.sample_count || 1);
        // Running average update
        const newAvgCost = b.avg_monthly_cost != null && tool.monthly_cost != null
          ? (b.avg_monthly_cost * n + tool.monthly_cost) / (n + 1)
          : b.avg_monthly_cost ?? tool.monthly_cost;
        const newAvgUtil = b.avg_utilization_rate != null && utilRate != null
          ? (b.avg_utilization_rate * n + utilRate) / (n + 1)
          : b.avg_utilization_rate ?? utilRate;

        await base44.asServiceRole.entities.BenchmarkData.update(b.id, {
          avg_monthly_cost: newAvgCost != null ? Math.round(newAvgCost * 100) / 100 : b.avg_monthly_cost,
          avg_utilization_rate: newAvgUtil != null ? Math.round(newAvgUtil * 1000) / 1000 : b.avg_utilization_rate,
          sample_count: n + 1,
          category: tool.category || b.category,
        });
      } else {
        await base44.asServiceRole.entities.BenchmarkData.create({
          tool_name: tool.tool_name,
          category: tool.category || '',
          company_size_range: company_size || '11-50',
          avg_monthly_cost: tool.monthly_cost || 0,
          avg_utilization_rate: utilRate ?? 0,
          avg_activity_score: 50,
          sample_count: 1,
        });
      }
      contributed++;
    }

    return Response.json({ success: true, contributed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});