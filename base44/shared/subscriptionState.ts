import { addDays, getEntitlements } from "./entitlements.ts";

export async function ensureSubscription(base44, user) {
  const existing = await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: user.id });
  if (existing[0]) return existing[0];
  const companies = await base44.entities.Company.filter({ created_by_id: user.id });
  const company = companies[0] || await base44.entities.Company.create({ name: user.full_name ? `${user.full_name}'s workspace` : "My workspace" });
  const now = new Date();
  await base44.asServiceRole.entities.AcquisitionAttribution.create({ organization_id: company.id, owner_user_id: user.id, acquisition_source: "DIRECT", attributed_at: now.toISOString() });
  return await base44.asServiceRole.entities.OrganizationSubscription.create({ organization_id: company.id, owner_user_id: user.id, plan: "FREE_LAUNCH", subscription_status: "FREE", billing_interval: "none", trial_started_at: now.toISOString(), trial_ends_at: addDays(now, 90).toISOString(), payment_status: "NOT_REQUIRED", workspace_mode: "ACTIVE" });
}

export function accessPayload(subscription, planDefinition = null) {
  const end = subscription.promotional_access ? subscription.promotional_ends_at : subscription.trial_ends_at;
  const daysRemaining = end ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000)) : null;
  const defaults = getEntitlements(subscription.plan);
  const entitlements = { ...defaults, ...(planDefinition?.entitlements || {}), integration_limit: planDefinition?.integration_limit ?? defaults.integration_limit };
  return { subscription, entitlements, days_remaining: daysRemaining, read_only: subscription.workspace_mode === "READ_ONLY" };
}