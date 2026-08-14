import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const response = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100', { headers: { Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`, 'Stripe-Version': '2025-10-29.clover' } });
    const data = await response.json();
    if (!response.ok) return Response.json({ error: data.error?.message || 'Stripe request failed' }, { status: 400 });
    const subscriptions = (data.data || []).map((subscription) => ({ id: subscription.id, status: subscription.status, customer: subscription.customer, current_period_end: subscription.current_period_end, products: (subscription.items?.data || []).map((item) => ({ product_id: typeof item.price?.product === 'string' ? item.price.product : item.price?.product?.id || null, quantity: item.quantity || 1 })) }));
    return Response.json({ success: true, total: subscriptions.length, subscriptions, evidence_status: 'INSUFFICIENT_EVIDENCE', evidence_eligible: false, evidence_note: 'Stripe Billing records customer revenue subscriptions, not the organization SaaS expenses required for procurement savings.' });
  } catch (error) {
    console.error('Stripe subscription read failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}