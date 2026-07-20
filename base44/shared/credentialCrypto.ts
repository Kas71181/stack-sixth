const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function encryptionKey() {
  const secret = Deno.env.get("INTEGRATION_CREDENTIAL_ENCRYPTION_KEY");
  if (!secret) throw new Error("Credential encryption is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptCredential(payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, await encryptionKey(),
    new TextEncoder().encode(JSON.stringify(payload))
  );
  return { encrypted_payload: toBase64(new Uint8Array(encrypted)), encryption_iv: toBase64(iv) };
}

export async function decryptCredential(record) {
  if (!record?.encrypted_payload || !record?.encryption_iv) {
    return { api_key: record?.api_key || "", extra_fields: record?.extra_fields || {} };
  }
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(record.encryption_iv) },
    await encryptionKey(), fromBase64(record.encrypted_payload)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}