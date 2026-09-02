import { timingSafeEqual } from "node:crypto";
import { decryptToken } from "../../_lib/crypto.js";
import { supabaseAdmin } from "../../_lib/supabase.js";

// Server-to-server: the Base44 sync function (getSlackActivity) exchanges the
// internal key for a decrypted token. Supabase + AES keys never leave Vercel.
function keyMatches(provided) {
  const expected = process.env.INTERNAL_SYNC_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!keyMatches(req.headers["x-internal-key"])) return res.status(401).json({ error: "Unauthorized" });

  const appUserId = req.body?.app_user_id;
  if (!appUserId) return res.status(400).json({ error: "app_user_id is required" });

  const { data, error } = await supabaseAdmin()
    .from("oauth_connections")
    .select("encrypted_token, token_iv, provider_workspace_id")
    .eq("app_user_id", appUserId)
    .eq("provider", "slack")
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "No Slack connection for this user" });

  const accessToken = await decryptToken(data.encrypted_token, data.token_iv);
  return res.status(200).json({ access_token: accessToken, team_id: data.provider_workspace_id });
}
