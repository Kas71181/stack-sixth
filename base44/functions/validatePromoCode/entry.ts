import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { normalizeCode, validatePromo } from "../../shared/promo.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Sign in before applying a code." }, { status: 401 });
    const { code } = await req.json();
    const since = new Date(Date.now() - 15 * 60000).toISOString();
    const attempts = await base44.asServiceRole.entities.PromoCodeAttempt.filter({ user_id: user.id, attempted_at: { $gte: since } });
    if (attempts.length >= 10) return Response.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    try {
      const result = await validatePromo(base44, code);
      await base44.asServiceRole.entities.PromoCodeAttempt.create({ user_id: user.id, code_prefix: normalizeCode(code).slice(0, 12), successful: true, reason: "VALID", attempted_at: new Date().toISOString() });
      return Response.json({ valid: true, code: result.promo.code, partner_name: result.partner.partner_name, campaign_name: result.campaign.campaign_name, eligible_plan: result.promo.eligible_plan, benefit_type: result.promo.benefit_type, benefit_duration_months: result.promo.benefit_duration_months || result.campaign.benefit_duration_months });
    } catch (error) {
      await base44.asServiceRole.entities.PromoCodeAttempt.create({ user_id: user.id, code_prefix: normalizeCode(code).slice(0, 12), successful: false, reason: error.message, attempted_at: new Date().toISOString() });
      return Response.json({ error: error.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Promo validation failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}