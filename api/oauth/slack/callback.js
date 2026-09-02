import { OAuth2Client } from "arctic";
import { verifyState } from "../../_lib/state.js";
import { encryptToken } from "../../_lib/crypto.js";
import { supabaseAdmin } from "../../_lib/supabase.js";

const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

// Self-closing popup page, same UX as base44/functions/apolloOAuth.
function popupPage(message) {
  return `<!doctype html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
<p>${message}</p><p>You can close this window.</p>
<script>setTimeout(function(){ window.close(); }, 1500);</script>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  const { code, state, error } = req.query;
  if (error) return res.status(400).send(popupPage("Slack authorization was cancelled."));

  const payload = await verifyState(state);
  if (!payload || payload.provider !== "slack" || !payload.userId) {
    return res.status(400).send(popupPage("This authorization link is invalid or expired. Please try connecting again."));
  }

  try {
    const redirectUri = `https://${process.env.OAUTH_HOST || "stacksixth.com"}/api/oauth/slack/callback`;
    const client = new OAuth2Client(process.env.SLACK_CLIENT_ID, process.env.SLACK_CLIENT_SECRET, redirectUri);
    const tokens = await client.validateAuthorizationCode(SLACK_TOKEN_URL, code, null);
    const data = tokens.data;

    // Slack returns HTTP 200 with ok:false on failure, and puts user-scope tokens under authed_user.
    if (!data.ok) throw new Error(data.error || "Slack token exchange failed");
    const accessToken = data.authed_user?.access_token || data.access_token;
    if (!accessToken) throw new Error("Slack response contained no access token");

    const { encrypted, iv } = await encryptToken(accessToken);
    const now = new Date().toISOString();
    const { error: dbError } = await supabaseAdmin().from("oauth_connections").upsert(
      {
        app_user_id: payload.userId,
        provider: "slack",
        provider_workspace_id: data.team?.id || null,
        authed_provider_user_id: data.authed_user?.id || null,
        encrypted_token: encrypted,
        token_iv: iv,
        token_type: "user",
        scopes: (data.authed_user?.scope || "").split(",").filter(Boolean),
        metadata: { team_name: data.team?.name || null, app_id: data.app_id || null },
        updated_at: now,
      },
      { onConflict: "app_user_id,provider" }
    );
    if (dbError) throw new Error(`Vault write failed: ${dbError.message}`);

    return res.status(200).send(popupPage("Slack connected successfully."));
  } catch (err) {
    console.error("Slack OAuth callback failed", err);
    return res.status(500).send(popupPage("Slack connection failed. Please try again or contact support."));
  }
}
