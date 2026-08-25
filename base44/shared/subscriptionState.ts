import { getEntitlements } from "./entitlements.ts";

const LEGACY_PLANS = new Set(["FREE_LAUNCH"]);

export async function ensureSubscription(base44, user) {
  const existing = await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: user.id });
  if (existing[0]) return existing[0];
  const companies = await base44.entities.Company.filter({ created_by_id: user.id });
  const ownerEmail = String(user.email || "").trim().toLowerCase();
  const company = companies[0] || await base44.entities.Company.create({ name: user.full_name ? `${user.full_name}'s workspace` : "My workspace", owner_user_id: user.id, member_ids: [user.id], member_emails: ownerEmail ? [ownerEmail] : [], manager_ids: [user.id], manager_emails: ownerEmail ? [ownerEmail] : [] });
  const now = new Date();
  await base44.asServiceRole.entities.AcquisitionAttribution.create({ organization_id: company.id, owner_user_id: user.id, acquisition_source: "DIRECT", attributed_at: now.toISOString() });
  return await base44.asServiceRole.entities.OrganizationSubscription.create({ organization_id: company.id, owner_user_id: user.id, plan: "STARTER", subscription_status: "PENDING_PAYMENT", billing_interval: "monthly", payment_status: "PENDING", workspace_mode: "READ_ONLY" });
}
export function accessPayload(subscription, planDefinition = null) {
  const end = subscription.promotional_access ? subscription.promotional_ends_at : ["FREE", "TRIALING"].includes(subscription.subscription_status) ? subscription.trial_ends_at : subscription.current_period_end;
  const daysRemaining = end ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)) : null;
  const defaults = getEntitlements(subscription.plan); const entitlements = { ...defaults, ...(planDefinition?.entitlements || {}), integration_limit: planDefinition?.integration_limit ?? defaults.integration_limit };
  const planStatus = LEGACY_PLANS.has(subscription.plan) ? "legacy" : planDefinition?.active ? "active" : "inactive";
  return { subscription, entitlements, plan_status: planStatus, entitlements_source: planDefinition ? "configured" : "built_in", days_remaining: daysRemaining, read_only: subscription.workspace_mode === "READ_ONLY" };
}