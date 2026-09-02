import { OAuth2Client } from "arctic";
import { verifyBase44User } from "../../_lib/base44auth.js";
import { signState } from "../../_lib/state.js";

const SLACK_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";
const USER_SCOPES = "users:read,users:read.email,channels:read";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).json({ error: "Slack OAuth is not configured" });
  }

  const user = await verifyBase44User(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const redirectUri = `https://${process.env.OAUTH_HOST || "stacksixth.com"}/api/oauth/slack/callback`;
  const state = await signState({ userId: user.id, provider: "slack" });
  const client = new OAuth2Client(clientId, clientSecret, redirectUri);
  const url = client.createAuthorizationURL(SLACK_AUTHORIZE_URL, state, []);
  // Slack workspace-install flow: user token scopes go in the nonstandard user_scope param.
  url.searchParams.set("user_scope", USER_SCOPES);
  url.searchParams.set("scope", "");

  return res.status(200).json({ url: url.toString() });
}
