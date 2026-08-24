import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import Stripe from "npm:stripe@18.5.0";
import { secrets } from "base44:runtime";
const statusMap = { incomplete:"INCOMPLETE", trialing:"TRIALING", active:"ACTIVE", past_due:"PAST_DUE", canceled:"CANCELLED", unpaid:"UNPAID" };
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const stripe = new Stripe(secrets.get("STRIPE_SECRET_KEY"), { apiVersion: "2025-10-29.clover" });
    const event = await stripe.webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature"), secrets.get("STRIPE_WEBHOOK_SECRET"));
    const object = event.data.object; let metadata = object.metadata || {}; let stripeSubscriptionId = object.object === "subscription" ? object.id : object.subscription;
    let records = metadata.owner_user_id ? await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: metadata.owner_user_id }) : [];
    if (!records[0] && stripeSubscriptionId) records = await base44.asServiceRole.entities.OrganizationSubscription.filter({ stripe_subscription_id: stripeSubscriptionId });
    const record = records[0]; if (!record) return Response.json({ received: true, ignored: true });
    if (event.type === "checkout.session.completed") {
      const stripeSub = await stripe.subscriptions.retrieve(object.subscription); metadata = stripeSub.metadata || metadata;
      await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { plan: metadata.plan || record.plan, billing_interval: metadata.billing_interval || record.billing_interval, subscription_status: statusMap[stripeSub.status] || "TRIALING", payment_status: "METHOD_ON_FILE", stripe_customer_id: object.customer, stripe_subscription_id: object.subscription, stripe_price_id: stripeSub.items.data[0]?.price?.id, trial_started_at: new Date().toISOString(), trial_ends_at: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : undefined, current_period_start: stripeSub.current_period_start ? new Date(stripeSub.current_period_start * 1000).toISOString() : undefined, current_period_end: stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000).toISOString() : undefined, workspace_mode: "ACTIVE" });
      await base44.asServiceRole.entities.AcquisitionEvent.create({ organization_id: record.organization_id, owner_user_id: record.owner_user_id, event_name: "checkout_completed", properties: { plan: metadata.plan || record.plan, trial_days: 90 }, occurred_at: new Date().toISOString() });
    } else if (["customer.subscription.created","customer.subscription.updated"].includes(event.type)) {
      const mapped = statusMap[object.status] || record.subscription_status; const active = ["TRIALING","ACTIVE"].includes(mapped) || (mapped === "CANCELLED" && object.current_period_end * 1000 > Date.now());
      await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { plan: metadata.plan || record.plan, billing_interval: metadata.billing_interval || record.billing_interval, subscription_status: mapped, stripe_customer_id: object.customer || record.stripe_customer_id, stripe_subscription_id: object.id, stripe_price_id: object.items?.data?.[0]?.price?.id || record.stripe_price_id, trial_ends_at: object.trial_end ? new Date(object.trial_end * 1000).toISOString() : record.trial_ends_at, current_period_start: object.current_period_start ? new Date(object.current_period_start * 1000).toISOString() : record.current_period_start, current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : record.current_period_end, cancel_at_period_end: !!object.cancel_at_period_end, canceled_at: object.canceled_at ? new Date(object.canceled_at * 1000).toISOString() : record.canceled_at, workspace_mode: active ? "ACTIVE" : "READ_ONLY" });
    } else if (event.type === "invoice.payment_failed") await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { subscription_status: "PAST_DUE", payment_status: "FAILED", past_due_started_at: new Date().toISOString() });
    else if (event.type === "invoice.paid") await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { subscription_status: "ACTIVE", payment_status: "PAID", paid_subscription_started_at: record.paid_subscription_started_at || new Date().toISOString(), workspace_mode: "ACTIVE" });
    else if (event.type === "customer.subscription.deleted") await base44.asServiceRole.entities.OrganizationSubscription.update(record.id, { subscription_status: "EXPIRED", workspace_mode: "READ_ONLY" });
    return Response.json({ received: true });
  } catch (error) { console.error("Stripe webhook failed", error); return Response.json({ error: error.message }, { status: 400 }); }
}