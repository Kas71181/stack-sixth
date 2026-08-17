export const CANONICAL_APPS = [
  { canonical_app_id: 'slack', name: 'Slack', vendor_name: 'Salesforce', primary_domain: 'slack.com', aliases: ['slack', 'slack com', 'slack technologies', 'microsoft entra slack enterprise app'], category: 'Communication', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'github', name: 'GitHub', vendor_name: 'GitHub', primary_domain: 'github.com', aliases: ['github', 'github.com'], category: 'Dev Tools', default_dormancy_days: 60, seasonal: false },
  { canonical_app_id: 'notion', name: 'Notion', vendor_name: 'Notion Labs', primary_domain: 'notion.so', aliases: ['notion', 'notion.so'], category: 'Productivity & Docs', default_dormancy_days: 45, seasonal: false },
  { canonical_app_id: 'apollo-io', name: 'Apollo.io', vendor_name: 'Apollo', primary_domain: 'apollo.io', aliases: ['apollo', 'apollo io', 'apollo.io'], category: 'CRM & Sales', default_dormancy_days: 45, seasonal: false },
  { canonical_app_id: 'google-workspace', name: 'Google Workspace', vendor_name: 'Google', primary_domain: 'workspace.google.com', aliases: ['google workspace', 'g suite', 'google apps'], category: 'Productivity & Docs', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'quickbooks', name: 'QuickBooks', vendor_name: 'Intuit', primary_domain: 'quickbooks.intuit.com', aliases: ['quickbooks', 'quickbooks online'], category: 'Finance & HR', default_dormancy_days: 90, seasonal: false },
  { canonical_app_id: 'salesforce', name: 'Salesforce', vendor_name: 'Salesforce', primary_domain: 'salesforce.com', aliases: ['salesforce', 'salesforce crm'], category: 'CRM & Sales', default_dormancy_days: 45, seasonal: false },
  { canonical_app_id: 'hubspot', name: 'HubSpot', vendor_name: 'HubSpot', primary_domain: 'hubspot.com', aliases: ['hubspot', 'hubspot marketing'], category: 'Marketing', default_dormancy_days: 45, seasonal: false },
  { canonical_app_id: 'zoom', name: 'Zoom', vendor_name: 'Zoom', primary_domain: 'zoom.us', aliases: ['zoom', 'zoom video'], category: 'Communication', default_dormancy_days: 45, seasonal: false },
  { canonical_app_id: 'bamboohr', name: 'BambooHR', vendor_name: 'BambooHR', primary_domain: 'bamboohr.com', aliases: ['bamboohr', 'bamboo hr'], category: 'Finance & HR', default_dormancy_days: 90, seasonal: false }
];

export function normalizeApplicationName(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function resolveCanonicalApp(value = '') {
  const normalized = normalizeApplicationName(value);
  const match = CANONICAL_APPS.find((app) => app.aliases.includes(normalized) || normalizeApplicationName(app.primary_domain) === normalized || normalizeApplicationName(app.vendor_name) === normalized);
  if (match) return match;
  const slug = normalized.replace(/\s+/g, '-');
  return { canonical_app_id: slug, name: value.trim(), vendor_name: value.trim(), primary_domain: '', aliases: [normalized], category: 'Other', default_dormancy_days: 60, seasonal: false };
}