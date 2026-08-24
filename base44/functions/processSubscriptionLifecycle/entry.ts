import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    const subscriptions = await base44.asServiceRole.entities.OrganizationSubscription.list("-created_date", 500);
    let expired = 0, notified = 0;
    for (const subscription of subscriptions) {
      const activationStart = subscription.trial_started_at || subscription.promotional_started_at || subscription.paid_subscription_started_at || subscription.created_date;
      if (activationStart) {
        const ageDays = Math.floor((Date.now() - new Date(activationStart).getTime()) / 86400000);
        for (const milestone of [7, 30, 60]) {
          if (ageDays < milestone) continue;
          const eventName = `${milestone}_day_active`;
          const priorActive = await base44.asServiceRole.entities.AcquisitionEvent.filter({ organization_id: subscription.organization_id, event_name: eventName });
          if (priorActive[0]) continue;
          const activeSince = new Date(new Date(activationStart).getTime() + milestone * 86400000).toISOString();
          const activity = await base44.asServiceRole.entities.AcquisitionEvent.filter({ organization_id: subscription.organization_id, event_name: "app_active", occurred_at: { $gte: activeSince } });
          if (activity[0]) await base44.asServiceRole.entities.AcquisitionEvent.create({ organization_id: subscription.organization_id, owner_user_id: subscription.owner_user_id, event_name: eventName, properties: {}, occurred_at: new Date().toISOString() });
        }
      }
      if (!["FREE", "PROMOTIONAL"].includes(subscription.subscription_status)) continue;
      const start = subscription.promotional_access ? subscription.promotional_started_at : subscription.trial_started_at;
      const end = subscription.promotional_access ? subscription.promotional_ends_at : subscription.trial_ends_at;
      if (!end) continue;
      const now = new Date(), endDate = new Date(end);
      if (endDate <= now) {
        await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, { subscription_status: "READ_ONLY", workspace_mode: "READ_ONLY", payment_status: "NO_PAYMENT_METHOD" });
        expired += 1;
        continue;
      }
      if (subscription.promotional_access || !start) continue;
      const day = Math.floor((now.getTime() - new Date(start).getTime()) / 86400000);
      const milestone = [90, 89, 85, 75, 60].find((value) => day >= value);
      if (!milestone) continue;
      const eventName = `free_launch_day_${milestone}`;
      const prior = await base44.asServiceRole.entities.AcquisitionEvent.filter({ organization_id: subscription.organization_id, event_name: eventName });
      if (prior[0]) continue;
      const owner = await base44.asServiceRole.entities.User.get(subscription.owner_user_id);
      if (!owner?.email) continue;
      const apps = await base44.asServiceRole.entities.SaasIntegration.filter({ created_by_id: subscription.owner_user_id });
      const contracts = await base44.asServiceRole.entities.Contract.filter({ created_by_id: subscription.owner_user_id });
      const recommendations = await base44.asServiceRole.entities.Recommendation.filter({ created_by_id: subscription.owner_user_id });
      const annualSpend = apps.reduce((sum, app) => sum + Number(app.monthly_cost || 0) * 12, 0);
      const verifiedSavings = recommendations.filter((item) => item.evidence_level && item.evidence_level !== "INSUFFICIENT_EVIDENCE").reduce((sum, item) => sum + Number(item.financial_impact || 0), 0);
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
      const evidence = [`${apps.length} applications in your inventory`, contracts.length ? `${contracts.length} renewal opportunities tracked` : null, annualSpend > 0 ? `$${annualSpend.toLocaleString()} annual software spend identified` : null, verifiedSavings > 0 ? `$${verifiedSavings.toLocaleString()} in evidence-backed annual savings identified` : null].filter(Boolean).join("\n");
      await base44.asServiceRole.integrations.Core.SendEmail({ to: owner.email, from_name: "Stack Sixth", subject: `Your Stack Sixth Free Launch ends in ${daysRemaining} days`, body: `Your Stack Sixth Free Launch ends in ${daysRemaining} days.\n\nDuring your time with Stack Sixth:\n${evidence || "Your software intelligence remains available in Stack Sixth."}\n\nKeep Stack Sixth working for you. Choose your plan: https://stack-sixth-spend.base44.app/pricing` });
      await base44.asServiceRole.entities.AcquisitionEvent.create({ organization_id: subscription.organization_id, owner_user_id: subscription.owner_user_id, event_name: eventName, properties: { days_remaining: daysRemaining }, occurred_at: now.toISOString() });
      notified += 1;
    }
    return Response.json({ processed: subscriptions.length, expired, notified });
  } catch (error) {
    console.error("Subscription lifecycle failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}