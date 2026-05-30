import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { stripe_key } = await req.json();
    if (!stripe_key) {
      return Response.json({ error: 'stripe_key is required' }, { status: 400 });
    }

    // Fetch active subscriptions from Stripe
    const subsResponse = await fetch('https://api.stripe.com/v1/subscriptions?status=active&limit=100&expand[]=data.items.data.price.product', {
      headers: {
        'Authorization': `Bearer ${stripe_key}`,
      },
    });

    if (!subsResponse.ok) {
      const err = await subsResponse.json();
      return Response.json({ error: err.error?.message || 'Stripe API error' }, { status: 400 });
    }

    const subsData = await subsResponse.json();

    // Map subscriptions to our tool format
    const tools = subsData.data.map((sub) => {
      const item = sub.items?.data?.[0];
      const price = item?.price;
      const product = price?.product;

      const monthlyCost = price
        ? (price.unit_amount / 100) * (price.recurring?.interval === 'year' ? 1 / 12 : 1)
        : null;

      return {
        name: typeof product === 'object' ? product.name : 'Unknown',
        category: 'Other',
        monthly_cost: monthlyCost ? Math.round(monthlyCost * 100) / 100 : null,
        stripe_subscription_id: sub.id,
        status: sub.status,
        current_period_end: sub.current_period_end,
        quantity: item?.quantity || 1,
      };
    });

    return Response.json({ tools, total: tools.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});