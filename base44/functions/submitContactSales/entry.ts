import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (body.website) return Response.json({ success: true });
    const required = ["first_name","last_name","work_email","company","company_size","job_title","message","preferred_contact"];
    if (required.some((key) => !String(body[key] || "").trim()) || body.consent !== true) return Response.json({ error: "Please complete all required fields and provide consent." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.work_email)) return Response.json({ error: "Enter a valid work email address." }, { status: 400 });
    const safe = Object.fromEntries(required.map((key) => [key, String(body[key]).trim().slice(0, key === "message" ? 3000 : 250)]));
    const lead = await base44.asServiceRole.entities.ContactSalesLead.create({ ...safe, phone: String(body.phone || "").trim().slice(0, 50), consent: true, status: "new" });
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    if (admins[0]?.email) await base44.asServiceRole.integrations.Core.SendEmail({ to: admins[0].email, from_name: "Stack Sixth", subject: `Contact sales: ${safe.company}`, body: `${safe.first_name} ${safe.last_name}\n${safe.work_email}\n${safe.job_title} at ${safe.company}\nPreferred contact: ${safe.preferred_contact}\n\n${safe.message}` });
    return Response.json({ success: true, id: lead.id });
  } catch (error) { console.error("Contact sales submission failed", error); return Response.json({ error: "We could not submit your request. Please try again." }, { status: 500 }); }
}