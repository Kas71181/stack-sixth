import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Seeds industry-average benchmark data using AI so comparisons work from day one.
// Safe to call multiple times — skips tools already seeded.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await base44.asServiceRole.entities.BenchmarkData.list();
    if (existing.length >= 20) {
      return Response.json({ success: true, seeded: 0, message: 'Already seeded' });
    }

    const existingTools = new Set(existing.map((b) => b.tool_name.toLowerCase()));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a SaaS industry analyst. Generate realistic benchmark data for the 25 most common B2B SaaS tools.
For each tool return: tool_name, category, avg_monthly_cost (per company, not per seat), avg_utilization_rate (0-1 decimal), avg_activity_score (0-100), sample_count (realistic number 50-500).
Include: Slack, Zoom, Notion, GitHub, HubSpot, Salesforce, Jira, Confluence, Figma, Asana, Monday.com, Linear, Intercom, Zendesk, Mixpanel, Amplitude, Datadog, PagerDuty, Okta, 1Password, Airtable, Loom, Calendly, Miro, Greenhouse.
Return ONLY valid JSON array.`,
      response_json_schema: {
        type: 'object',
        properties: {
          benchmarks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tool_name: { type: 'string' },
                category: { type: 'string' },
                avg_monthly_cost: { type: 'number' },
                avg_utilization_rate: { type: 'number' },
                avg_activity_score: { type: 'number' },
                sample_count: { type: 'number' },
              },
            },
          },
        },
      },
    });

    const toSeed = (result.benchmarks || []).filter((b) => !existingTools.has(b.tool_name.toLowerCase()));
    let seeded = 0;
    for (const b of toSeed) {
      await base44.asServiceRole.entities.BenchmarkData.create({
        tool_name: b.tool_name,
        category: b.category,
        avg_monthly_cost: b.avg_monthly_cost,
        avg_utilization_rate: b.avg_utilization_rate,
        avg_activity_score: b.avg_activity_score,
        sample_count: b.sample_count,
        industry: 'All',
        company_size_range: '11-50',
      });
      seeded++;
    }

    return Response.json({ success: true, seeded });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});