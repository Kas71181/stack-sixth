// AES-GCM token encryption, same scheme as base44/shared/credentialCrypto.ts:
// key = SHA-256(secret string), 96-bit random IV, base64 ciphertext + IV.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function importKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY is not configured");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptToken(plaintext) {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext));
  return {
    encrypted: Buffer.from(new Uint8Array(ciphertext)).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
  };
}

export async function decryptToken(encrypted, iv) {
  const key = await importKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Buffer.from(iv, "base64") },
    key,
    Buffer.from(encrypted, "base64")
  );
  return decoder.decode(plaintext);
}
