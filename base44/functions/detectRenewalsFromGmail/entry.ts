import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
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
    if (body.checkOnly) return Response.json({ connected: true, candidates: [] });
    const headers = { Authorization: `Bearer ${accessToken}` };
    const query = 'newer_than:2y (invoice OR receipt OR renewal OR subscription OR billing OR discount OR "special offer" OR promo OR coupon OR "payment received")';
    const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=80&q=${encodeURIComponent(query)}`, { headers });
    if (!listRes.ok) throw new Error(`Gmail search failed (${listRes.status})`);
    const messages = (await listRes.json()).messages || [];
    const decode = (value) => { if (!value) return ''; const normalized = value.replace(/-/g, '+').replace(/_/g, '/'); return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')); };
    const extractText = (payload) => { let text = payload?.body?.data ? decode(payload.body.data) : ''; for (const part of payload?.parts || []) text += `\n${extractText(part)}`; return text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' '); };
    const senderVendor = (from) => { const domain = from.match(/@([\w.-]+)/)?.[1]?.toLowerCase(); if (!domain) return null; const root = domain.split('.').slice(-2, -1)[0]; if (!root || ['google', 'gmail', 'outlook', 'stripe', 'paypal'].includes(root)) return null; return root.charAt(0).toUpperCase() + root.slice(1).replace(/[-_]/g, ' '); };
    const parseMoney = (text) => {
      const match = text.match(/(?:total|amount due|charged|payment|paid)[^\d$€£]{0,35}(USD|EUR|GBP|CAD|AUD|[$€£])?\s*([\d,]+(?:\.\d{2})?)/i) || text.match(/(USD|EUR|GBP|CAD|AUD|[$€£])\s*([\d,]+(?:\.\d{2})?)/i);
      if (!match) return { amount: null, currency: 'USD' };
      const token = (match[1] || '$').toUpperCase(); const currency = token === '€' || token === 'EUR' ? 'EUR' : token === '£' || token === 'GBP' ? 'GBP' : ['CAD', 'AUD'].includes(token) ? token : 'USD';
      return { amount: Number(match[2].replace(/,/g, '')), currency };
    };
    const parseDate = (text) => { const match = text.match(/(?:renews?|renewal date|next billing date|next payment)[^\n.]{0,55}?((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})/i); const parsed = match ? new Date(match[1]) : null; return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null; };
    const candidates = [];
    const discounts = [];
    await Promise.all(messages.slice(0, 50).map(async ({ id }) => {
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers }); if (!response.ok) return;
      const message = await response.json(); const headerMap = Object.fromEntries((message.payload?.headers || []).map((header) => [header.name.toLowerCase(), header.value])); const subject = headerMap.subject || ''; const text = `${subject} ${extractText(message.payload || {})}`.slice(0, 16000);
      if (!/(invoice|receipt|renew|subscription|billing|payment)/i.test(text)) return;
      const vendorName = senderVendor(headerMap.from || '') || text.match(/(?:from|vendor|merchant)[:\s]+([A-Z][\w &.-]{2,40})/i)?.[1]?.trim(); if (!vendorName) return;
      const money = parseMoney(text); const renewalDate = parseDate(text); const billingFrequency = /quarterly|every three months/i.test(text) ? 'quarterly' : /annual|annually|yearly|per year/i.test(text) ? 'annual' : /monthly|per month/i.test(text) ? 'monthly' : 'unknown'; const invoiceDate = new Date(Number(message.internalDate || Date.now())).toISOString().slice(0, 10); const evidenceTypes = ['SUBSCRIPTION_DISCOVERY']; if (money.amount) evidenceTypes.push('FINANCIAL'); if (renewalDate || billingFrequency !== 'unknown') evidenceTypes.push('RENEWAL');
      candidates.push({ vendor_name: vendorName, amount: money.amount, currency: money.currency, billing_period: billingFrequency, billing_frequency: billingFrequency, invoice_date: invoiceDate, renewal_date: renewalDate, source_type: 'gmail', source_record_id: id, source_label: 'Gmail billing email', subject, evidence_types: evidenceTypes, confidence: money.amount || renewalDate ? 90 : 70 });
      if (/(discount|special offer|promo(?:tion)?|coupon|save\s+\d|%\s*off)/i.test(text)) {
        const percentMatch = text.match(/(?:save\s+)?(\d{1,2})%\s*(?:off|discount|savings)?/i);
        const codeMatch = text.match(/(?:code|coupon)[:\s]+([A-Z0-9-]{4,20})/i);
        discounts.push({ vendor_name: vendorName, title: subject || 'Account offer', discount_percent: percentMatch ? Number(percentMatch[1]) : null, terms: codeMatch ? `Use code ${codeMatch[1]}` : 'See the original email for eligibility and terms', source_record_id: id, subject });
      }
    }));
    candidates.sort((a, b) => (b.invoice_date || '').localeCompare(a.invoice_date || ''));
    return Response.json({ connected: true, candidates: candidates.slice(0, 30), suggestions: candidates.filter((item) => item.renewal_date).slice(0, 20), discounts: discounts.slice(0, 30), scanned: Math.min(messages.length, 50) });
  } catch (error) {
    console.error('Gmail billing evidence scan failed', error);
    return Response.json({ connected: true, error: error.message }, { status: 200 });
  }
}