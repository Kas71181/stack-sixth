import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { validatePromo } from "../../shared/promo.ts";
import { accessPayload } from "../../shared/subscriptionState.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const plan = String(body.plan || "STARTER").toUpperCase();
    if (!["STARTER", "GROWTH", "SCALE", "ENTERPRISE"].includes(plan)) return Response.json({ error: "Invalid plan" }, { status: 400 });
    const companyData = body.company || {};
    if (!String(companyData.name || "").trim()) return Response.json({ error: "Company name is required" }, { status: 400 });
    const companies = await base44.entities.Company.filter({ created_by_id: user.id });
    const ownerEmail = String(user.email || "").trim().toLowerCase();
    const safeCompany = { name: String(companyData.name).trim(), owner_user_id: user.id, member_ids: [user.id], member_emails: ownerEmail ? [ownerEmail] : [], manager_ids: [user.id], manager_emails: ownerEmail ? [ownerEmail] : [], industry: String(companyData.industry || "Other"), employee_count: Number(companyData.employee_count || 0), company_size: companyData.company_size || "1-9", estimated_software_apps: Number(companyData.estimated_software_apps || 0), contact_role: String(companyData.contact_role || "Other"), contact_first_name: String(companyData.contact_first_name || ""), contact_last_name: String(companyData.contact_last_name || "") };
    const company = companies[0] ? await base44.entities.Company.update(companies[0].id, safeCompany) : await base44.entities.Company.create(safeCompany);
    const now = new Date();
    const existing = await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: user.id });
    let subscription = existing[0];
    let attributionData = { organization_id: company.id, owner_user_id: user.id, acquisition_source: "DIRECT", attributed_at: now.toISOString() };
    if (body.promo_code) {
      const { promo, campaign, partner, promotionalEndsAt } = await validatePromo(base44, body.promo_code);
      const update = { organization_id: company.id, owner_user_id: user.id, plan: promo.eligible_plan, subscription_status: "PROMOTIONAL", billing_interval: "none", promotional_access: true, promotional_partner: partner.partner_id, promotional_campaign: campaign.campaign_id, promotional_started_at: now.toISOString(), promotional_ends_at: promotionalEndsAt.toISOString(), payment_status: "NO_PAYMENT_METHOD", workspace_mode: "ACTIVE" };
      subscription = subscription ? await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, update) : await base44.asServiceRole.entities.OrganizationSubscription.create(update);
      await base44.asServiceRole.entities.PromotionalCode.update(promo.id, { current_redemptions: (promo.current_redemptions || 0) + 1, redeemed_by: company.id, redeemed_at: now.toISOString(), status: promo.single_use ? "REDEEMED" : "ACTIVE" });
      await base44.asServiceRole.entities.Partner.update(partner.id, { total_redemptions: (partner.total_redemptions || 0) + 1, total_activations: (partner.total_activations || 0) + 1 });
      await base44.entities.AcquisitionEvent.create({ organization_id: company.id, owner_user_id: user.id, event_name: "promo_code_redeemed", properties: { partner_id: partner.partner_id, campaign_id: campaign.campaign_id }, occurred_at: now.toISOString() });
      attributionData = { ...attributionData, acquisition_source: "PARTNER", partner_id: partner.partner_id, campaign_id: campaign.campaign_id, promo_code: promo.code };
    } else if (!subscription || ["FREE", "PENDING_PAYMENT", "READ_ONLY", "EXPIRED"].includes(subscription.subscription_status)) {
      const update = { organization_id: company.id, owner_user_id: user.id, plan, subscription_status: "PENDING_PAYMENT", billing_interval: body.billing_interval === "annual" ? "annual" : "monthly", promotional_access: false, payment_status: "PENDING", workspace_mode: "READ_ONLY" };
      subscription = subscription ? await base44.asServiceRole.entities.OrganizationSubscription.update(subscription.id, update) : await base44.asServiceRole.entities.OrganizationSubscription.create(update);
    }
    const attribution = await base44.asServiceRole.entities.AcquisitionAttribution.filter({ owner_user_id: user.id });
    if (!attribution[0]) await base44.asServiceRole.entities.AcquisitionAttribution.create(attributionData);
    await base44.entities.AcquisitionEvent.create({ organization_id: company.id, owner_user_id: user.id, event_name: "workspace_created", properties: { plan: subscription.plan, source: attributionData.acquisition_source }, occurred_at: now.toISOString() });
    const planDefinitions = await base44.asServiceRole.entities.PlanDefinition.filter({ plan_key: subscription.plan, active: true });
    return Response.json({ ...accessPayload(subscription, planDefinitions[0]), contact_required: plan === "ENTERPRISE" });
  } catch (error) {
    console.error("Access initialization failed", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}