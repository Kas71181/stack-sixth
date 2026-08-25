import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

const allowedHosts = new Set(["stacksixth.com", "www.stacksixth.com", "stack-sixth-spend.base44.app"]);
const maxLengths = { first_name: 80, last_name: 80, work_email: 254, company: 150, company_size: 20, job_title: 150, message: 3000, preferred_contact: 10, phone: 50 };

export default async function(req) {
  try {
    if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
    const origin = req.headers.get("origin");
    let originHost = "";
    try { originHost = origin ? new URL(origin).hostname.toLowerCase() : ""; } catch { originHost = ""; }
    const previewOrigin = originHost.endsWith(".base44.app") && originHost.includes("preview");
    if (!allowedHosts.has(originHost) && !previewOrigin) return Response.json({ error: "Unauthorized request origin" }, { status: 403 });
    if (!(req.headers.get("content-type") || "").toLowerCase().includes("application/json")) return Response.json({ error: "Unsupported content type" }, { status: 415 });
    const declaredSize = Number(req.headers.get("content-length") || 0);
    if (declaredSize > 12000) return Response.json({ error: "Request is too large" }, { status: 413 });

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (JSON.stringify(body).length > 12000) return Response.json({ error: "Request is too large" }, { status: 413 });
    if (String(body.website || "").trim()) return Response.json({ success: true });

    const required = ["first_name", "last_name", "work_email", "company", "company_size", "job_title", "message", "preferred_contact"];
    if (required.some((key) => !String(body[key] || "").trim()) || body.consent !== true) return Response.json({ error: "Please complete all required fields and provide consent." }, { status: 400 });
    if (Object.entries(maxLengths).some(([key, limit]) => String(body[key] || "").length > limit)) return Response.json({ error: "One or more fields exceed the allowed length." }, { status: 400 });
    const email = String(body.work_email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Enter a valid work email address." }, { status: 400 });
    if (!new Set(["1-9", "10-49", "50-249", "250-999", "1000+"]).has(body.company_size) || !new Set(["email", "phone"]).has(body.preferred_contact)) return Response.json({ error: "Invalid form selection." }, { status: 400 });

    const clientAddress = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const fingerprintBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${clientAddress}|${req.headers.get("user-agent") || "unknown"}`));
    const requestFingerprint = Array.from(new Uint8Array(fingerprintBytes)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const recent = await base44.asServiceRole.entities.ContactSalesLead.filter({ request_fingerprint: requestFingerprint }, "-created_date", 5);
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    if (recent.filter((lead) => new Date(lead.created_date).getTime() > cutoff).length >= 3) return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });

    const safe = Object.fromEntries(required.map((key) => [key, String(body[key]).trim()]));
    safe.work_email = email;
    const lead = await base44.asServiceRole.entities.ContactSalesLead.create({ ...safe, phone: String(body.phone || "").trim(), consent: true, status: "new", request_fingerprint: requestFingerprint });
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    if (admins[0]?.email) await base44.asServiceRole.integrations.Core.SendEmail({ to: admins[0].email, from_name: "Stack Sixth", subject: `Contact sales: ${safe.company}`, body: `${safe.first_name} ${safe.last_name}\n${safe.work_email}\n${safe.job_title} at ${safe.company}\nPreferred contact: ${safe.preferred_contact}\n\n${safe.message}` });
    return Response.json({ success: true, id: lead.id });
  } catch (error) {
    console.error("Contact sales submission failed", error);
    return Response.json({ error: "We could not submit your request. Please try again." }, { status: 500 });
  }
}