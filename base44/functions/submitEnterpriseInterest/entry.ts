import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const companies = await base44.entities.Company.filter({ created_by_id: user.id });
    const company = companies[0];
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    if (admins[0]?.email) await base44.asServiceRole.integrations.Core.SendEmail({ to: admins[0].email, from_name: "Stack Sixth", subject: `Enterprise inquiry: ${company?.name || user.email}`, body: `${user.full_name || user.email} requested Stack Sixth Enterprise access.\n\nCompany: ${company?.name || "Not provided"}\nCompany size: ${company?.company_size || "1,000+"}\nIndustry: ${company?.industry || "Not provided"}\nRole: ${company?.contact_role || "Not provided"}\nEmail: ${user.email}` });
    await base44.entities.AcquisitionEvent.create({ organization_id: company?.id, owner_user_id: user.id, event_name: "enterprise_inquiry_submitted", properties: {}, occurred_at: new Date().toISOString() });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Enterprise inquiry failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}