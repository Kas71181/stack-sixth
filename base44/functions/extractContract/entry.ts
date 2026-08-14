import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const schema = {
      type: 'object',
      properties: {
        vendor_name: { type: 'string', description: 'Software vendor or SaaS company' },
        contract_name: { type: 'string', description: 'Subscription, plan, agreement, or contract name' },
        contract_type: { type: 'string', description: 'SaaS Subscription, Annual License, Monthly License, Enterprise Agreement, or Other' },
        monthly_cost: { type: 'number', description: 'Monthly cost in USD; derive from annual if needed' },
        annual_cost: { type: 'number', description: 'Annual total cost in USD' },
        renewal_date: { type: 'string', description: 'Renewal or expiry date in YYYY-MM-DD format' },
        renewal_confidence: { type: 'number', description: 'Confidence from 0 to 100 that the extracted renewal date is correct' },
        notice_period_days: { type: 'number', description: 'Days notice required before cancellation; omit if not stated' },
        auto_renews: { type: 'boolean', description: 'Whether the contract auto-renews' },
        seats_licensed: { type: 'number', description: 'Number of seats or licenses purchased' },
        negotiation_leverage: { type: 'string', description: 'Clauses, discounts, or pricing flexibility useful in a negotiation' },
        key_terms: { type: 'array', items: { type: 'string' }, description: 'Up to five important terms or conditions' }
      },
      required: ['vendor_name']
    };
    const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'Read this software contract. Extract only details explicitly supported by the document. Do not invent missing dates, notice periods, costs, or terms. Return the renewal fields in the requested schema for user review.',
      file_urls: [file_url],
      response_json_schema: schema
    });
    return Response.json({ success: true, extracted, file_url });
  } catch (error) {
    console.error('Contract extraction failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}