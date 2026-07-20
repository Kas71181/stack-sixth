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
    logo: "https://assets-global.website-files.com/60b86da97e58f877a9d4e89f/60e5db46929e39b89bed2e96_apollo-logo.png",
  },
};

export function connectorFor(toolName = "") {
  const key = toolName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key === "apollo" || key === "apolloio") return INVENTORY_CONNECTORS.apollo;
  return INVENTORY_CONNECTORS[key] || null;
}