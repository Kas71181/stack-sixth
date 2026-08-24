export const INVENTORY_CONNECTORS = {
  slack: {
    id: "slack", label: "Slack", connectorId: "6a1dba44349cdfe5f00d8fb7", functionName: "getSlackActivity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png",
  },
  github: {
    id: "github", label: "GitHub", connectorId: "6a1db9e6a90dd35761465e22", functionName: "getGitHubActivity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  },
  notion: {
    id: "notion", label: "Notion", connectorId: "6a1db8b6d0e9930c01976399", functionName: "getNotionActivity",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
  },
  apollo: {
    id: "apollo", label: "Apollo.io", oauthFunction: "apolloOAuth", functionName: "getApolloActivity",
    idleLabel: "Connect Apollo to verify credit and API usage",
    logo: "https://assets-global.website-files.com/60b86da97e58f877a9d4e89f/60e5db46929e39b89bed2e96_apollo-logo.png",
  },
  hubspot: { id: "hubspot", label: "HubSpot", setupRequired: true, authMode: "API token", functionName: "getHubSpotActivity" },
  googlemeet: { id: "googlemeet", label: "Google Meet", setupRequired: true, authMode: "Per-user OAuth" },
  jira: { id: "jira", label: "Jira", setupRequired: true, authMode: "Per-user OAuth" },
  quickbooks: { id: "quickbooks", label: "QuickBooks", setupRequired: true, authMode: "Shared OAuth" },
  salesforce: { id: "salesforce", label: "Salesforce", setupRequired: true, authMode: "Per-user OAuth" },
  googleworkspace: {
    id: "googleworkspace", label: "Google Workspace", connectorId: "6a2c11c93a60aebc9a354fd8",
    functionName: "detectToolsFromGmail", connectionMode: "evidence", actionLabel: "Scan Gmail evidence",
    successLabel: "Gmail evidence scanned — financial evidence only",
    idleLabel: "Connect Gmail to scan for verified vendor and billing evidence",
    logo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
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