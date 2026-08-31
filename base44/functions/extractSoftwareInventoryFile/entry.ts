import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { file_url } = await req.json();
    if (!file_url || !String(file_url).startsWith('https://')) return Response.json({ error: 'A valid uploaded file URL is required' }, { status: 400 });
    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: { type: 'object', properties: { tools: { type: 'array', items: { type: 'object', properties: {
        name: { type: 'string' }, category: { type: 'string' }, monthly_cost: { type: 'number' }
      } } } } }
    });
    return Response.json(result);
  } catch (error) {
    console.error('Software inventory extraction failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}