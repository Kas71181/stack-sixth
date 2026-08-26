import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { ensureSubscription, accessPayload } from "../../shared/subscriptionState.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    let subscription = await ensureSubscription(base44, user);
    const promotionExpired = subscription.promotional_access && subscription.promotional_ends_at && new Date(subscription.promotional_ends_at) <= new Date();
    if (promotionExpired && subscription.workspace_mode !== "READ_ONLY") {
      subscription = await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, {
        subscription_status: "READ_ONLY",
        promotional_access: false,
        payment_status: "NO_PAYMENT_METHOD",
        workspace_mode: "READ_ONLY"
      });
    }
    const plans = await base44.asServiceRole.entities.PlanDefinition.filter({ plan_key: subscription.plan, active: true });
    return Response.json(accessPayload(subscription, plans[0]));
  } catch (error) {
    console.error("Subscription access failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}