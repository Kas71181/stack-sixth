import { toolLogoUrl } from "@/lib/toolLogos";

export const INVENTORY_CONNECTORS = {
  slack: {
    id: "slack", label: "Slack", customOAuthPath: "/api/oauth/slack/start", functionName: "getSlackActivity",
    logo: toolLogoUrl("Slack"),
  },
  github: {
    id: "github", label: "GitHub", connectorId: "6a1db3c9aaf496e3cd5d7a33", functionName: "getGitHubActivity",
    logo: toolLogoUrl("GitHub"),
  },
  notion: {
    id: "notion", label: "Notion", connectorId: "6a1db8b6d0e9930c01976399", functionName: "getNotionActivity",
    logo: toolLogoUrl("Notion"),
  },
  apollo: {
    id: "apollo", label: "Apollo.io", oauthFunction: "apolloOAuth", functionName: "getApolloActivity",
    idleLabel: "Connect Apollo to verify credit and API usage",
    logo: toolLogoUrl("Apollo.io"),
  },
  hubspot: { id: "hubspot", label: "HubSpot", authMode: "API token", functionName: "getHubSpotActivity", evidenceType: "live" },
  vercel: { id: "vercel", label: "Vercel", functionName: "getVercelActivity" },
  zoom: {
    id: "zoom", label: "Zoom", functionName: "getZoomActivity", evidenceType: "live",
    credentialFields: [
      { name: "api_key", label: "Client ID", placeholder: "Zoom Server-to-Server OAuth Client ID" },
      { name: "client_secret", label: "Client secret", placeholder: "Zoom Server-to-Server OAuth Client Secret" },
      { name: "account_id", label: "Account ID", placeholder: "Zoom Account ID" },
    ],
  },
  googlemeet: { id: "googlemeet", label: "Google Meet", setupRequired: true, authMode: "Per-user OAuth" },
  jira: { id: "jira", label: "Jira", setupRequired: true, authMode: "Per-user OAuth" },
  quickbooks: { id: "quickbooks", label: "QuickBooks", setupRequired: true, authMode: "Shared OAuth" },
  salesforce: { id: "salesforce", label: "Salesforce", setupRequired: true, authMode: "Per-user OAuth" },
  googleworkspace: {
    id: "googleworkspace", label: "Google Workspace", connectorId: "6a2c11c93a60aebc9a354fd8",
    functionName: "detectToolsFromGmail", connectionMode: "evidence", actionLabel: "Scan Gmail evidence",
    successLabel: "Gmail evidence scanned — financial evidence only",
    idleLabel: "Connect Gmail to scan for verified vendor and billing evidence",
    logo: toolLogoUrl("Google Workspace"),
  },
};

export const GMAIL_EVIDENCE_CONNECTOR = {
  id: "googleworkspace", label: "Gmail", connectorId: "6a2c11c93a60aebc9a354fd8",
  functionName: "detectToolsFromGmail", connectionMode: "evidence", actionLabel: "Scan Gmail evidence",
  successLabel: "Financial evidence found in Gmail",
  idleLabel: "Scan Gmail for vendor and billing evidence",
  logo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
};

const CONNECTOR_ALIASES = {
  apolloio: "apollo",
  hubspotmarketing: "hubspot",
};

export function connectorFor(toolName = "") {
  const key = toolName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return INVENTORY_CONNECTORS[CONNECTOR_ALIASES[key] || key] || null;
}