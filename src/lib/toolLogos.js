const TOOL_DOMAINS = {
  "apolloio": "apollo.io",
  "claude": "claude.ai",
  "datadog": "datadoghq.com",
  "figma": "figma.com",
  "github": "github.com",
  "googlemeet": "meet.google.com",
  "googleworkspace": "workspace.google.com",
  "gusto": "gusto.com",
  "hubspot": "hubspot.com",
  "hubspotmarketing": "hubspot.com",
  "jira": "atlassian.com/software/jira",
  "notion": "notion.so",
  "okta": "okta.com",
  "quickbooks": "quickbooks.intuit.com",
  "salesnavigator": "linkedin.com/sales",
  "salesforce": "salesforce.com",
  "slack": "slack.com",
  "stripe": "stripe.com",
  "trello": "trello.com",
  "vercel": "vercel.com",
  "zendesk": "zendesk.com",
  "zoom": "zoom.us",
};

const normalize = (name = "") => name.toLowerCase().replace(/[^a-z0-9]/g, "");

export function toolLogoUrl(name) {
  const domain = TOOL_DOMAINS[normalize(name)];
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : "";
}