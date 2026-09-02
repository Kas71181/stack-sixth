// HMAC-signed OAuth state, same pattern as base44/functions/apolloOAuth/entry.ts:
// base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload)), 10-minute TTL.
const encoder = new TextEncoder();
const STATE_TTL_MS = 10 * 60 * 1000;

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function hmacKey() {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error("OAUTH_STATE_SECRET is not configured");
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signState(payload) {
  const body = JSON.stringify({ ...payload, createdAt: Date.now() });
  const key = await hmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${b64url(encoder.encode(body))}.${b64url(new Uint8Array(signature))}`;
}

export async function verifyState(state) {
  const [bodyPart, signaturePart] = String(state || "").split(".");
  if (!bodyPart || !signaturePart) return null;
  const body = Buffer.from(bodyPart, "base64url");
  const key = await hmacKey();
  const valid = await crypto.subtle.verify("HMAC", key, Buffer.from(signaturePart, "base64url"), body);
  if (!valid) return null;
  let payload;
  try {
    payload = JSON.parse(body.toString("utf8"));
  } catch {
    return null;
  }
  if (!payload.createdAt || Date.now() - payload.createdAt > STATE_TTL_MS) return null;
  return payload;
}
