import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── AFFILIATE LINKS MAP ───────────────────────────────────────────────────
// Add / edit tool names and affiliate URLs here. Tool name matching is case-insensitive.
const AFFILIATE_LINKS = {
  "hubspot":       "https://hubspot.com/?ref=YOUR_AFFILIATE_ID",
  "salesforce":    "https://salesforce.com/?ref=YOUR_AFFILIATE_ID",
  "slack":         "https://slack.com/intl/en-gb/?ref=YOUR_AFFILIATE_ID",
  "notion":        "https://notion.so/?ref=YOUR_AFFILIATE_ID",
  "asana":         "https://asana.com/?ref=YOUR_AFFILIATE_ID",
  "monday.com":    "https://monday.com/?ref=YOUR_AFFILIATE_ID",
  "jira":          "https://atlassian.com/software/jira?ref=YOUR_AFFILIATE_ID",
  "zoom":          "https://zoom.us/?ref=YOUR_AFFILIATE_ID",
  "google workspace": "https://workspace.google.com/?ref=YOUR_AFFILIATE_ID",
  "microsoft 365": "https://microsoft.com/en-us/microsoft-365?ref=YOUR_AFFILIATE_ID",
  "dropbox":       "https://dropbox.com/?ref=YOUR_AFFILIATE_ID",
  "stripe":        "https://stripe.com/?ref=YOUR_AFFILIATE_ID",
  "quickbooks":    "https://quickbooks.intuit.com/?ref=YOUR_AFFILIATE_ID",
  "xero":          "https://xero.com/?ref=YOUR_AFFILIATE_ID",
  "zendesk":       "https://zendesk.com/?ref=YOUR_AFFILIATE_ID",
  "intercom":      "https://intercom.com/?ref=YOUR_AFFILIATE_ID",
  "mailchimp":     "https://mailchimp.com/?ref=YOUR_AFFILIATE_ID",
  "pipedrive":     "https://pipedrive.com/?ref=YOUR_AFFILIATE_ID",
  "figma":         "https://figma.com/?ref=YOUR_AFFILIATE_ID",
  "loom":          "https://loom.com/?ref=YOUR_AFFILIATE_ID",
  "linear":        "https://linear.app/?ref=YOUR_AFFILIATE_ID",
  "clickup":       "https://clickup.com/?ref=YOUR_AFFILIATE_ID",
};
// ──────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tool_name } = await req.json();
    if (!tool_name) {
      return Response.json({ url: null });
    }

    const key = tool_name.toLowerCase().trim();
    const url = AFFILIATE_LINKS[key] || null;

    return Response.json({ url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});