import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { priceFor } from "../../shared/stripeCatalog.ts";
import { ensureSubscription } from "../../shared/subscriptionState.ts";
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { plan, billing_interval } = await req.json();
    const normalizedPlan = String(plan || "").toUpperCase();
    const interval = billing_interval === "annual" ? "annual" : "monthly";
    const priceId = priceFor(normalizedPlan, interval);
    if (!priceId) return Response.json({ error: "This plan does not use online checkout." }, { status: 400 });
    const subscription = await ensureSubscription(base44, user);
    const headers = { Authorization: `Bearer ${secrets.get("STRIPE_SECRET_KEY")}`, "Stripe-Version": "2025-10-29.clover", "Content-Type": "application/x-www-form-urlencoded" };
    if (subscription.stripe_subscription_id && ["ACTIVE","TRIALING"].includes(subscription.subscription_status)) {
      const currentRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`, { headers }); const current = await currentRes.json();
      if (!currentRes.ok) throw new Error(current.error?.message || "Unable to load subscription");
      const params = new URLSearchParams({ "items[0][id]": current.items.data[0].id, "items[0][price]": priceId, proration_behavior: subscription.subscription_status === "TRIALING" ? "none" : "create_prorations", "metadata[base44_app_id]": secrets.get("BASE44_APP_ID"), "metadata[organization_id]": subscription.organization_id, "metadata[owner_user_id]": user.id, "metadata[plan]": normalizedPlan, "metadata[billing_interval]": interval });
      const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`, { method: "POST", headers, body: params }); const updated = await updateRes.json();
      if (!updateRes.ok) throw new Error(updated.error?.message || "Unable to update subscription");
      await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, { plan: normalizedPlan, billing_interval: interval, stripe_price_id: priceId });
      return Response.json({ upgraded: true, redirect_url: "/settings/billing" });
    }
    const params = new URLSearchParams({ mode: "subscription", "line_items[0][price]": priceId, "line_items[0][quantity]": "1", customer_email: user.email, payment_method_collection: "always", allow_promotion_codes: "true", success_url: "https://stack-sixth-spend.base44.app/checkout/success?session_id={CHECKOUT_SESSION_ID}", cancel_url: "https://stack-sixth-spend.base44.app/checkout/cancelled", "metadata[base44_app_id]": secrets.get("BASE44_APP_ID"), "metadata[organization_id]": subscription.organization_id, "metadata[owner_user_id]": user.id, "metadata[plan]": normalizedPlan, "metadata[billing_interval]": interval, "subscription_data[trial_period_days]": "30", "subscription_data[metadata][base44_app_id]": secrets.get("BASE44_APP_ID"), "subscription_data[metadata][organization_id]": subscription.organization_id, "subscription_data[metadata][owner_user_id]": user.id, "subscription_data[metadata][plan]": normalizedPlan, "subscription_data[metadata][billing_interval]": interval });
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { ...headers, "Idempotency-Key": crypto.randomUUID() }, body: params }); const session = await response.json();
    if (!response.ok) throw new Error(session.error?.message || "Unable to start checkout");
    const hasActivePromotion = Boolean(subscription.promotional_access && subscription.promotional_ends_at && new Date(subscription.promotional_ends_at) > new Date() && subscription.workspace_mode === "ACTIVE");
    const checkoutUpdate = hasActivePromotion
      ? { stripe_checkout_session_id: session.id }
      : { plan: normalizedPlan, billing_interval: interval, stripe_price_id: priceId, subscription_status: "PENDING_PAYMENT", payment_status: "PENDING", workspace_mode: "READ_ONLY", stripe_checkout_session_id: session.id };
    await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, checkoutUpdate);
    return Response.json({ checkout_url: session.url });
  } catch (error) { console.error("Stripe checkout failed", error); return Response.json({ error: error.message }, { status: 500 }); }
}