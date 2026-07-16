import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    let accessToken;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a2c11c93a60aebc9a354fd8'));
    } catch (error) {
      return Response.json({ connected: false, error: error.message });
    }
    if (body.checkOnly) return Response.json({ connected: true });

    const headers = { Authorization: `Bearer ${accessToken}` };
    const query = 'newer_than:2y (invoice OR receipt OR renewal OR subscription OR "next billing")';
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=60&q=${encodeURIComponent(query)}`;
    const listRes = await fetch(listUrl, { headers });
    if (!listRes.ok) throw new Error('Gmail could not be searched');
    const listData = await listRes.json();
    const messages = listData.messages || [];
    const [integrations, contracts] = await Promise.all([
      base44.entities.SaasIntegration.filter({ created_by_id: user.id }),
      base44.entities.Contract.filter({ created_by_id: user.id }),
    ]);
    const vendors = [...new Set([...integrations.map((item) => item.tool_name), ...contracts.map((item) => item.vendor_name)].filter(Boolean))]
      .sort((a, b) => b.length - a.length);

    const decode = (value) => {
      if (!value) return '';
      const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
      return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    };
    const extractText = (payload) => {
      let text = payload?.body?.data ? decode(payload.body.data) : '';
      for (const part of payload?.parts || []) text += `\n${extractText(part)}`;
      return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    };
    const addPeriod = (date, cadence, direction = 1) => {
      const result = new Date(date);
      if (cadence === 'monthly') result.setMonth(result.getMonth() + direction);
      if (cadence === 'quarterly') result.setMonth(result.getMonth() + (3 * direction));
      if (cadence === 'annual') result.setFullYear(result.getFullYear() + direction);
      return result;
    };
    const parseExplicitDate = (text) => {
      const match = text.match(/(?:renews?|renewal date|next billing date|next payment)[^\n.]{0,45}?((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})/i);
      if (!match) return null;
      const parsed = new Date(match[1]);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const inferVendor = (text, from) => {
      const matched = vendors.find((vendor) => text.toLowerCase().includes(vendor.toLowerCase()));
      if (matched) return matched;
      const domain = from.match(/@([\w.-]+)/)?.[1]?.split('.').slice(-2, -1)[0];
      if (!domain || ['google', 'gmail', 'outlook', 'stripe'].includes(domain.toLowerCase())) return null;
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    };

    const detected = new Map();
    await Promise.all(messages.slice(0, 40).map(async ({ id }) => {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers });
      if (!response.ok) return;
      const message = await response.json();
      const headerMap = Object.fromEntries((message.payload?.headers || []).map((header) => [header.name.toLowerCase(), header.value]));
      const subject = headerMap.subject || '';
      const text = `${subject} ${extractText(message.payload || {})}`.slice(0, 12000);
      if (!/(invoice|receipt|renew|subscription|billing|payment)/i.test(text)) return;
      const vendor = inferVendor(text, headerMap.from || '');
      if (!vendor) return;
      const cadence = /quarterly|every three months/i.test(text) ? 'quarterly' : /annual|annually|yearly|per year/i.test(text) ? 'annual' : /monthly|per month/i.test(text) ? 'monthly' : 'unknown';
      const explicitNext = parseExplicitDate(text);
      if (!explicitNext && cadence === 'unknown') return;
      const messageDate = new Date(Number(message.internalDate || Date.now()));
      let nextDate = explicitNext || addPeriod(messageDate, cadence);
      while (nextDate < new Date() && cadence !== 'unknown') nextDate = addPeriod(nextDate, cadence);
      if (nextDate < new Date()) return;
      const lastDate = cadence === 'unknown' ? null : addPeriod(nextDate, cadence, -1);
      const suggestion = {
        vendor_name: vendor,
        last_renewal_date: lastDate?.toISOString().split('T')[0] || null,
        renewal_date: nextDate.toISOString().split('T')[0],
        billing_frequency: cadence,
        renewal_source: 'gmail',
        renewal_confidence: explicitNext ? 90 : 65,
        evidence: explicitNext ? 'Renewal date found in an email' : `${cadence} billing inferred from a recent invoice`,
        subject,
      };
      const key = vendor.toLowerCase();
      if (!detected.has(key) || suggestion.renewal_confidence > detected.get(key).renewal_confidence) detected.set(key, suggestion);
    }));
    return Response.json({ connected: true, suggestions: [...detected.values()].slice(0, 20), scanned: Math.min(messages.length, 40) });
  } catch (error) {
    return Response.json({ connected: true, error: error.message }, { status: 200 });
  }
});