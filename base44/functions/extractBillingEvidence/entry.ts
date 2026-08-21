import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { file_uri } = await req.json();
    if (!file_uri) return Response.json({ error: 'file_uri required' }, { status: 400 });
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 600 });
    const schema = {
      type: 'object',
      properties: {
        vendor_name: { type: 'string' }, amount: { type: 'number' }, currency: { type: 'string' },
        invoice_date: { type: 'string' }, billing_period: { type: 'string' }, invoice_number: { type: 'string' },
        plan_name: { type: 'string' }, quantity: { type: 'number' }, unit_price: { type: 'number' },
        renewal_date: { type: 'string' }, billing_frequency: { type: 'string' }, confidence: { type: 'number' }
      },
      required: ['vendor_name']
    };
    const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'Extract software billing evidence from this invoice or receipt. Use only values explicitly shown. Dates must be YYYY-MM-DD. Currency must be a three-letter code. Billing frequency must be monthly, quarterly, annual, or unknown. Do not infer missing prices or renewal dates. Return a confidence score from 0 to 100.',
      file_urls: [signed_url], response_json_schema: schema
    });
    return Response.json({ success: true, extracted: { ...extracted, source_type: 'uploaded_invoice', source_record_id: file_uri, source_label: 'Confirmed uploaded invoice', file_uri, evidence_types: ['SUBSCRIPTION_DISCOVERY', ...(extracted.amount ? ['FINANCIAL'] : []), ...(extracted.renewal_date ? ['RENEWAL'] : [])] } });
  } catch (error) {
    console.error('Billing evidence extraction failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}