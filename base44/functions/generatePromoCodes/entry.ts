import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomPart = (length = 8) => Array.from(crypto.getRandomValues(new Uint8Array(length)), (value) => alphabet[value % alphabet.length]).join("");

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" || user.id !== "6a188e324c7d088bf6af68e4") return Response.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const mode = body.mode === "reusable" ? "reusable" : "unique";
    const count = Math.min(1000, Math.max(1, Number(body.count || 1)));
    const maxRedemptions = Math.min(10000, Math.max(1, Number(body.max_redemptions || 100)));
    const campaigns = await base44.asServiceRole.entities.PartnerCampaign.filter({ campaign_id: body.campaign_id });
    const campaign = campaigns[0];
    if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });
    const partners = await base44.asServiceRole.entities.Partner.filter({ partner_id: campaign.partner_id });
    const partner = partners[0];
    if (!partner) return Response.json({ error: "Partner not found" }, { status: 404 });
    const prefix = String(body.prefix || partner.partner_name).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24) || "PARTNER";
    const existing = await base44.asServiceRole.entities.PromotionalCode.filter({ campaign_id: campaign.campaign_id });
    const used = new Set(existing.map((item) => item.code));
    const baseRecord = { partner_id: partner.partner_id, campaign_id: campaign.campaign_id, benefit_type: campaign.benefit_type, benefit_value: campaign.benefit_value || 0, ...(campaign.benefit_duration_days ? { benefit_duration_days: campaign.benefit_duration_days } : { benefit_duration_months: campaign.benefit_duration_months || 1 }), eligible_plan: campaign.eligible_plan, valid_from: campaign.starts_at, expires_at: campaign.ends_at, current_redemptions: 0, status: "ACTIVE" };
    const records = [];
    if (mode === "reusable") {
      if (used.has(prefix)) return Response.json({ error: "This reusable code already exists." }, { status: 409 });
      records.push({ ...baseRecord, code: prefix, maximum_redemptions: maxRedemptions, single_use: false });
    } else {
      while (records.length < count) {
        const code = `${prefix}-${randomPart(8)}`;
        if (!used.has(code)) { used.add(code); records.push({ ...baseRecord, code, maximum_redemptions: 1, single_use: true }); }
      }
    }
    const created = await base44.asServiceRole.entities.PromotionalCode.bulkCreate(records);
    await base44.asServiceRole.entities.Partner.update(partner.id, { total_codes: (partner.total_codes || 0) + created.length });
    return Response.json({ created: created.length, mode, codes: created.map((item) => ({ id: item.id, code: item.code, status: item.status, single_use: item.single_use, maximum_redemptions: item.maximum_redemptions })) });
  } catch (error) {
    console.error("Promo code generation failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}