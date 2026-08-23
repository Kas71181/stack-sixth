import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { waitUntil } from 'base44:runtime';

const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

async function refreshVendorOffers(base44, toolNames, cachedOffers) {
  const result = await base44.integrations.Core.InvokeLLM({
    model: 'gemini_3_flash',
    add_context_from_internet: true,
    prompt: `Find currently published SaaS discounts for these tools: ${toolNames.join(', ')}. Only return offers supported by a public vendor-controlled pricing, promotion, startup, nonprofit, education, or annual-plan page. Do not infer discounts, use coupon aggregators, or return expired offers. Include the exact source URL and concise eligibility terms.`,
    response_json_schema: {
      type: 'object',
      properties: {
        offers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool_name: { type: 'string' }, title: { type: 'string' }, discount_percent: { type: 'number' },
              terms: { type: 'string' }, source_url: { type: 'string' }, expires_at: { type: 'string' }
            },
            required: ['tool_name', 'title', 'terms', 'source_url']
          }
        }
      }
    }
  });
  const checkedAt = new Date().toISOString();
  const records = (result?.offers || []).filter((offer) => /^https:\/\//i.test(offer.source_url || '')).filter((offer) => !cachedOffers.some((cached) => normalize(cached.tool_name) === normalize(offer.tool_name) && cached.source_url === offer.source_url && cached.title === offer.title)).map((offer) => ({ ...offer, verified_at: checkedAt, status: 'active' }));
  if (records.length) await base44.asServiceRole.entities.DiscountOpportunity.bulkCreate(records);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const toolNames = [...new Set((body.tool_names || []).filter(Boolean))].slice(0, 20);
    if (!toolNames.length) return Response.json({ offers: [], by_tool: {} });

    const cachedOffers = await base44.asServiceRole.entities.DiscountOpportunity.filter({ status: 'active' });
    const freshAfter = Date.now() - 24 * 60 * 60 * 1000;
    const freshCached = cachedOffers.filter((offer) => new Date(offer.verified_at).getTime() >= freshAfter);
    const toolsToRefresh = toolNames.filter((tool) => !freshCached.some((offer) => normalize(offer.tool_name) === normalize(tool)));

    const [partnerResult, inboxResult] = await Promise.allSettled([
      base44.asServiceRole.entities.AffiliateLink.filter({}),
      base44.functions.invoke('detectRenewalsFromGmail', { includeDiscounts: true })
    ]);
    if (toolsToRefresh.length) {
      waitUntil(refreshVendorOffers(base44, toolsToRefresh, cachedOffers).catch((error) => console.error('Vendor discount refresh failed', error)));
    }

    const matchesTool = (name) => toolNames.find((tool) => {
      const a = normalize(name), b = normalize(tool);
      return a && b && (a.includes(b) || b.includes(a));
    });
    const checkedAt = new Date().toISOString();
    const offers = freshCached.map((offer) => ({ ...offer, tool_name: matchesTool(offer.tool_name), source_type: 'vendor', verification_status: 'verified' })).filter((offer) => offer.tool_name);

    if (partnerResult.status === 'fulfilled') {
      for (const link of partnerResult.value || []) {
        const toolName = matchesTool(link.tool_name);
        if (!toolName || !link.notes) continue;
        offers.push({ tool_name: toolName, title: link.notes, terms: 'Partner catalog offer', source_type: 'partner_catalog', source_url: link.affiliate_url, verified_at: checkedAt, verification_status: 'verified' });
      }
    }

    if (inboxResult.status === 'fulfilled') {
      const inboxData = inboxResult.value?.data || inboxResult.value || {};
      for (const offer of inboxData.discounts || []) {
        const toolName = matchesTool(offer.vendor_name);
        if (!toolName) continue;
        offers.push({ ...offer, tool_name: toolName, source_type: 'inbox', verified_at: checkedAt, verification_status: 'verified' });
      }
    }

    const unique = [...new Map(offers.map((offer) => [`${normalize(offer.tool_name)}:${offer.source_type}:${normalize(offer.title)}`, offer])).values()];
    const byTool = Object.fromEntries(toolNames.map((tool) => [tool, unique.filter((offer) => offer.tool_name === tool)]));
    return Response.json({ offers: unique, by_tool: byTool, checked_at: checkedAt, refreshing: toolsToRefresh.length > 0 });
  } catch (error) {
    console.error('Discount opportunity scan failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}