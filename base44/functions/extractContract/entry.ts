import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          vendor_name: { type: 'string', description: 'Name of the software vendor or SaaS company' },
          contract_type: { type: 'string', description: 'Type: SaaS Subscription, Annual License, Monthly License, Enterprise Agreement, or Other' },
          monthly_cost: { type: 'number', description: 'Monthly cost in USD. Derive from annual if needed.' },
          annual_cost: { type: 'number', description: 'Annual total cost in USD' },
          renewal_date: { type: 'string', description: 'Contract renewal or expiry date in YYYY-MM-DD format' },
          notice_period_days: { type: 'number', description: 'Days notice required before cancellation. Default 30 if not stated.' },
          auto_renews: { type: 'boolean', description: 'Whether the contract auto-renews' },
          seats_licensed: { type: 'number', description: 'Number of seats or licenses purchased' },
          negotiation_leverage: { type: 'string', description: 'Any clauses, discounts offered, or pricing flexibility noted in the contract that could be used as negotiation leverage' },
          key_terms: { type: 'array', items: { type: 'string' }, description: 'Up to 5 most important terms or conditions from the contract' }
        },
        required: ['vendor_name']
      }
    });

    if (result.status !== 'success') {
      return Response.json({ error: result.details || 'Extraction failed' }, { status: 400 });
    }

    const extracted = Array.isArray(result.output) ? result.output[0] : result.output;

    // Auto-set status based on renewal date
    let status = 'Active';
    if (extracted.renewal_date) {
      const renewalMs = new Date(extracted.renewal_date).getTime();
      const nowMs = Date.now();
      const daysUntil = Math.floor((renewalMs - nowMs) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) status = 'Expired';
      else if (daysUntil <= 60) status = 'Expiring Soon';
    }

    const contract = await base44.asServiceRole.entities.Contract.create({
      ...extracted,
      file_url,
      status,
    });

    return Response.json({ success: true, contract });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});