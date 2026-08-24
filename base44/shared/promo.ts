import { addMonths } from "./entitlements.ts";

export const normalizeCode = (value) => String(value || "").trim().toUpperCase();

export async function validatePromo(base44, rawCode) {
  const code = normalizeCode(rawCode);
  if (!code) throw new Error("Enter a promotional code.");
  const matches = await base44.asServiceRole.entities.PromotionalCode.filter({ code });
  const promo = matches[0];
  if (!promo) throw new Error("This promotional code is not valid.");
  const now = new Date();
  if (promo.status !== "ACTIVE") throw new Error("This promotional code is no longer active.");
  if (promo.valid_from && new Date(promo.valid_from) > now) throw new Error("This promotional code is not active yet.");
  if (promo.expires_at && new Date(promo.expires_at) <= now) throw new Error("This promotional code has expired.");
  if ((promo.current_redemptions || 0) >= (promo.maximum_redemptions || 1)) throw new Error("This promotional code has reached its redemption limit.");
  if (promo.single_use && promo.redeemed_at) throw new Error("This promotional code has already been redeemed.");
  const campaigns = await base44.asServiceRole.entities.PartnerCampaign.filter({ campaign_id: promo.campaign_id });
  const campaign = campaigns[0];
  if (!campaign || campaign.status !== "ACTIVE") throw new Error("This partner campaign is not active.");
  if (campaign.starts_at && new Date(campaign.starts_at) > now) throw new Error("This partner campaign has not started.");
  if (campaign.ends_at && new Date(campaign.ends_at) <= now) throw new Error("This partner campaign has ended.");
  const partners = await base44.asServiceRole.entities.Partner.filter({ partner_id: promo.partner_id });
  const partner = partners[0];
  if (!partner || partner.status !== "ACTIVE") throw new Error("This partner is not active.");
  return { promo, campaign, partner, promotionalEndsAt: addMonths(now, promo.benefit_duration_months || campaign.benefit_duration_months || 1) };
}