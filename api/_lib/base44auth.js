import { createClient } from "@base44/sdk";

// Verifies a Base44 user token forwarded by the SPA and returns the user, or null.
export async function verifyBase44User(request) {
  const authorization = request.headers.get
    ? request.headers.get("authorization")
    : request.headers["authorization"];
  const token = (authorization || "").replace(/^Bearer\s+/i, "").trim();
  const appId = process.env.VITE_BASE44_APP_ID;
  if (!token || !appId) return null;
  try {
    const base44 = createClient({ appId, token, requiresAuth: false });
    const user = await base44.auth.me();
    return user?.id ? user : null;
  } catch {
    return null;
  }
}
