import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const milestones = {
  SaasIntegration: "first_software_added",
  IntegrationConnection: "first_integration_connected",
  SoftwareAudit: "first_audit_completed",
  Recommendation: "first_optimization_recommendation_generated"
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    if (!body.automation?.id) return Response.json({ error: "Automation only" }, { status: 403 });
    const entityName = body.event?.entity_name;
    const eventName = milestones[entityName];
    if (!eventName) return Response.json({ ignored: true });
    const ownerUserId = body.data?.created_by_id;
    if (!ownerUserId) return Response.json({ ignored: true, reason: "No owner" });
    const subscriptions = await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: ownerUserId });
    const subscription = subscriptions[0];
    if (!subscription) return Response.json({ ignored: true, reason: "No subscription" });
    const prior = await base44.asServiceRole.entities.AcquisitionEvent.filter({ organization_id: subscription.organization_id, event_name: eventName });
    if (prior[0]) return Response.json({ recorded: false, duplicate: true });
    await base44.asServiceRole.entities.AcquisitionEvent.create({ organization_id: subscription.organization_id, owner_user_id: ownerUserId, event_name: eventName, properties: { entity_id: body.event.entity_id }, occurred_at: new Date().toISOString() });
    return Response.json({ recorded: true, event_name: eventName });
  } catch (error) {
    console.error("Acquisition milestone failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}