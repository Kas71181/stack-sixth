import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import Stripe from "npm:stripe@18.5.0";
import { secrets } from "base44:runtime";
import { validatePromo } from "../../shared/promo.ts";

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Sign in before applying a code." }, { status: 401 });

    const { code } = await req.json();
    const { promo, campaign, partner } = await validatePromo(base44, code);
    if (promo.benefit_type !== "COMPLIMENTARY_PLAN") return Response.json({ error: "This code cannot be applied to an existing subscription." }, { status: 400 });

    const records = await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: user.id });
    const subscription = records[0];
    if (!subscription) return Response.json({ error: "Complete account setup before applying a code." }, { status: 400 });
    const hasActiveBilling = Boolean(subscription.stripe_subscription_id && ["ACTIVE", "TRIALING"].includes(subscription.subscription_status));

    const priorRedemptions = await base44.asServiceRole.entities.AcquisitionEvent.filter({ owner_user_id: user.id, event_name: "promo_code_redeemed" });
    if (priorRedemptions.some((event) => event.properties?.promo_code === promo.code)) {
      return Response.json({ error: "This code has already been applied to your account." }, { status: 409 });
    }

    const durationDays = Number(promo.benefit_duration_days || campaign.benefit_duration_days || 0);
    const durationMonths = Number(promo.benefit_duration_months || campaign.benefit_duration_months || 0);
    let promotionalStartsAt = new Date();
    let promotionalEndsAt;

    if (hasActiveBilling) {
      const stripe = new Stripe(secrets.get("STRIPE_SECRET_KEY"), { apiVersion: "2025-10-29.clover" });
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      if (!["active", "trialing"].includes(stripeSubscription.status)) {
        return Response.json({ error: "Your paid subscription is not currently active." }, { status: 400 });
      }
      const currentPeriodEnd = stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : new Date();
      const existingTrialEnd = stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : new Date();
      promotionalStartsAt = new Date(Math.max(Date.now(), currentPeriodEnd.getTime(), existingTrialEnd.getTime()));
      promotionalEndsAt = durationDays
        ? addDays(promotionalStartsAt, durationDays)
        : new Date(new Date(promotionalStartsAt).setMonth(promotionalStartsAt.getMonth() + Math.max(1, durationMonths)));
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        trial_end: Math.floor(promotionalEndsAt.getTime() / 1000),
        proration_behavior: "none",
        metadata: {
          ...stripeSubscription.metadata,
          base44_app_id: secrets.get("BASE44_APP_ID"),
          promotional_campaign: campaign.campaign_id,
          promotional_code_id: promo.id
        }
      });
      await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, {
        subscription_status: "TRIALING",
        promotional_access: true,
        promotional_partner: partner.partner_id,
        promotional_campaign: campaign.campaign_id,
        promotional_started_at: promotionalStartsAt.toISOString(),
        promotional_ends_at: promotionalEndsAt.toISOString(),
        trial_ends_at: promotionalEndsAt.toISOString(),
        workspace_mode: "ACTIVE"
      });
    } else {
      promotionalEndsAt = durationDays
        ? addDays(promotionalStartsAt, durationDays)
        : new Date(new Date(promotionalStartsAt).setMonth(promotionalStartsAt.getMonth() + Math.max(1, durationMonths)));
      await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, {
        plan: promo.eligible_plan,
        subscription_status: "PROMOTIONAL",
        billing_interval: "none",
        promotional_access: true,
        promotional_partner: partner.partner_id,
        promotional_campaign: campaign.campaign_id,
        promotional_started_at: promotionalStartsAt.toISOString(),
        promotional_ends_at: promotionalEndsAt.toISOString(),
        payment_status: "NOT_REQUIRED",
        workspace_mode: "ACTIVE"
      });
    }

    await base44.asServiceRole.entities.PromotionalCode.update(promo.id, {
      current_redemptions: (promo.current_redemptions || 0) + 1,
      redeemed_by: subscription.organization_id,
      redeemed_at: new Date().toISOString(),
      status: promo.single_use ? "REDEEMED" : "ACTIVE"
    });
    await base44.asServiceRole.entities.Partner.update(partner.id, {
      total_redemptions: (partner.total_redemptions || 0) + 1,
      total_activations: (partner.total_activations || 0) + 1
    });
    await base44.entities.AcquisitionEvent.create({
      organization_id: subscription.organization_id,
      owner_user_id: user.id,
      event_name: "promo_code_redeemed",
      properties: { partner_id: partner.partner_id, campaign_id: campaign.campaign_id, promo_code: promo.code, applied_to_existing_subscription: true },
      occurred_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      plan: hasActiveBilling ? subscription.plan : promo.eligible_plan,
      promotional_starts_at: promotionalStartsAt.toISOString(),
      promotional_ends_at: promotionalEndsAt.toISOString(),
      message: hasActiveBilling
        ? "Your complimentary period is scheduled. Your existing plan will resume automatically afterward."
        : "Your complimentary access is now active."
    });
  } catch (error) {
    console.error("Existing subscription promo redemption failed", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}