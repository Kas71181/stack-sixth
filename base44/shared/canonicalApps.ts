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
  { canonical_app_id: 'bamboohr', name: 'BambooHR', vendor_name: 'BambooHR', primary_domain: 'bamboohr.com', aliases: ['bamboohr', 'bamboo hr'], category: 'Finance & HR', default_dormancy_days: 90, seasonal: false },
  { canonical_app_id: 'chatgpt', name: 'ChatGPT', vendor_name: 'OpenAI', primary_domain: 'chatgpt.com', aliases: ['chatgpt', 'chat gpt', 'openai chatgpt'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'claude', name: 'Claude', vendor_name: 'Anthropic', primary_domain: 'claude.ai', aliases: ['claude', 'claude ai', 'anthropic claude'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'gemini', name: 'Gemini', vendor_name: 'Google', primary_domain: 'gemini.google.com', aliases: ['gemini', 'google gemini'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'microsoft-copilot', name: 'Microsoft Copilot', vendor_name: 'Microsoft', primary_domain: 'copilot.microsoft.com', aliases: ['microsoft copilot', 'm365 copilot', 'copilot for microsoft 365'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'perplexity', name: 'Perplexity', vendor_name: 'Perplexity AI', primary_domain: 'perplexity.ai', aliases: ['perplexity', 'perplexity ai'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'grok', name: 'Grok', vendor_name: 'xAI', primary_domain: 'grok.com', aliases: ['grok', 'xai grok'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'notion-ai', name: 'Notion AI', vendor_name: 'Notion Labs', primary_domain: 'notion.so/product/ai', aliases: ['notion ai'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'github-copilot', name: 'GitHub Copilot', vendor_name: 'GitHub', primary_domain: 'github.com/features/copilot', aliases: ['github copilot', 'copilot business', 'copilot enterprise'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'jasper', name: 'Jasper', vendor_name: 'Jasper AI', primary_domain: 'jasper.ai', aliases: ['jasper', 'jasper ai'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'grammarly', name: 'Grammarly', vendor_name: 'Grammarly', primary_domain: 'grammarly.com', aliases: ['grammarly', 'grammarly business'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'otter-ai', name: 'Otter.ai', vendor_name: 'Otter.ai', primary_domain: 'otter.ai', aliases: ['otter ai', 'otter.ai'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'midjourney', name: 'Midjourney', vendor_name: 'Midjourney', primary_domain: 'midjourney.com', aliases: ['midjourney', 'mid journey'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'adobe-firefly', name: 'Adobe Firefly', vendor_name: 'Adobe', primary_domain: 'firefly.adobe.com', aliases: ['adobe firefly', 'firefly ai'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'runway', name: 'Runway', vendor_name: 'Runway AI', primary_domain: 'runwayml.com', aliases: ['runway', 'runway ai', 'runway ml'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'synthesia', name: 'Synthesia', vendor_name: 'Synthesia', primary_domain: 'synthesia.io', aliases: ['synthesia', 'synthesia ai'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false },
  { canonical_app_id: 'elevenlabs', name: 'ElevenLabs', vendor_name: 'ElevenLabs', primary_domain: 'elevenlabs.io', aliases: ['elevenlabs', 'eleven labs'], category: 'AI & Machine Learning', default_dormancy_days: 30, seasonal: false }
];

const CANONICAL_ID_ALIASES = { apollo: 'apollo-io' };

export function normalizeCanonicalAppId(value = '') {
  return CANONICAL_ID_ALIASES[value] || value;
}

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