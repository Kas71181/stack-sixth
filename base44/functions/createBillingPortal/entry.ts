import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const records = await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: user.id });
    const subscription = records[0];
    if (!subscription?.stripe_customer_id) return Response.json({ error: "Billing management becomes available after checkout is completed." }, { status: 400 });
    const params = new URLSearchParams({ customer: subscription.stripe_customer_id, return_url: "https://stack-sixth-spend.base44.app/settings/billing" });
    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", { method: "POST", headers: { Authorization: `Bearer ${secrets.get("STRIPE_SECRET_KEY")}`, "Stripe-Version": "2025-10-29.clover", "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": crypto.randomUUID() }, body: params });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error?.message || "Unable to open billing management");
    return Response.json({ url: session.url });
  } catch (error) { console.error("Billing portal failed", error); return Response.json({ error: error.message }, { status: 500 }); }
}