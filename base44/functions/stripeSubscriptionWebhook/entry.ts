import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import Stripe from "npm:stripe@18.5.0";
import { secrets } from "base44:runtime";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(secrets.get("STRIPE_SECRET_KEY"), { apiVersion: "2025-10-29.clover" });
    const signature = req.headers.get("stripe-signature");
    const payload = await req.text();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, secrets.get("STRIPE_WEBHOOK_SECRET"));
    const object = event.data.object;
    const metadata = object.metadata || {};
    const stripeSubscriptionId = object.object === "subscription" ? object.id : object.subscription;
    let subscriptions = metadata.owner_user_id ? await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: metadata.owner_user_id }) : [];
    if (!subscriptions[0] && stripeSubscriptionId) subscriptions = await base44.asServiceRole.entities.OrganizationSubscription.filter({ stripe_subscription_id: stripeSubscriptionId });
    const record = subscriptions[0];
    if (!record) return Response.json({ received: true, ignored: true });
    if (event.type === "checkout.session.completed") {
      await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { plan: metadata.plan || record.plan, billing_interval: metadata.billing_interval || record.billing_interval, subscription_status: "ACTIVE", payment_status: "PAID", stripe_customer_id: object.customer, stripe_subscription_id: object.subscription, paid_subscription_started_at: new Date().toISOString(), promotional_access: false, workspace_mode: "ACTIVE" });
      const attributions = await base44.asServiceRole.entities.AcquisitionAttribution.filter({ organization_id: record.organization_id });
      const attribution = attributions[0];
      if (attribution?.partner_id) {
        const partners = await base44.asServiceRole.entities.Partner.filter({ partner_id: attribution.partner_id });
        if (partners[0]) await base44.asServiceRole.entities.Partner.update(partners[0].id, { paid_conversions: (partners[0].paid_conversions || 0) + 1 });
      }
      await base44.asServiceRole.entities.AcquisitionEvent.create({ organization_id: record.organization_id, owner_user_id: record.owner_user_id, event_name: "paid_conversion", properties: { plan: metadata.plan || record.plan }, occurred_at: new Date().toISOString() });
    } else if (event.type === "invoice.payment_failed") {
      await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { subscription_status: "PAST_DUE", payment_status: "FAILED" });
    } else if (event.type === "invoice.paid") {
      await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { subscription_status: "ACTIVE", payment_status: "PAID", workspace_mode: "ACTIVE" });
    } else if (event.type === "customer.subscription.updated") {
      const status = object.status === "active" || object.status === "trialing" ? "ACTIVE" : object.status === "past_due" ? "PAST_DUE" : record.subscription_status;
      await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { plan: metadata.plan || record.plan, billing_interval: metadata.billing_interval || record.billing_interval, subscription_status: status, current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : record.current_period_end, workspace_mode: status === "ACTIVE" ? "ACTIVE" : record.workspace_mode });
    } else if (event.type === "customer.subscription.deleted") {
      await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { subscription_status: "READ_ONLY", payment_status: "NO_PAYMENT_METHOD", workspace_mode: "READ_ONLY" });
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}