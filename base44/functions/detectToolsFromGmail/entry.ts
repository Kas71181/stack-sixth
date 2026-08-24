import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Known SaaS tools by domain keyword
const SAAS_DOMAIN_MAP = [
  { domain: "slack.com", name: "Slack", category: "Communication" },
  { domain: "notion.so", name: "Notion", category: "Productivity & Docs" },
  { domain: "notion.com", name: "Notion", category: "Productivity & Docs" },
  { domain: "github.com", name: "GitHub", category: "Dev Tools" },
  { domain: "gitlab.com", name: "GitLab", category: "Dev Tools" },
  { domain: "figma.com", name: "Figma", category: "Design" },
  { domain: "linear.app", name: "Linear", category: "Project Management" },
  { domain: "jira", name: "Jira", category: "Project Management" },
  { domain: "atlassian.com", name: "Jira", category: "Project Management" },
  { domain: "asana.com", name: "Asana", category: "Project Management" },
  { domain: "trello.com", name: "Trello", category: "Project Management" },
  { domain: "monday.com", name: "Monday.com", category: "Project Management" },
  { domain: "clickup.com", name: "ClickUp", category: "Project Management" },
  { domain: "hubspot.com", name: "HubSpot", category: "CRM & Sales" },
  { domain: "salesforce.com", name: "Salesforce", category: "CRM & Sales" },
  { domain: "pipedrive.com", name: "Pipedrive", category: "CRM & Sales" },
  { domain: "zoom.us", name: "Zoom", category: "Communication" },
  { domain: "zoom.com", name: "Zoom", category: "Communication" },
  { domain: "webex.com", name: "Webex", category: "Communication" },
  { domain: "teams.microsoft.com", name: "Microsoft Teams", category: "Communication" },
  { domain: "meet.google.com", name: "Google Meet", category: "Communication" },
  { domain: "loom.com", name: "Loom", category: "Communication" },
  { domain: "dropbox.com", name: "Dropbox", category: "Storage" },
  { domain: "box.com", name: "Box", category: "Storage" },
  { domain: "drive.google.com", name: "Google Drive", category: "Productivity & Docs" },
  { domain: "docs.google.com", name: "Google Workspace", category: "Productivity & Docs" },
  { domain: "gsuite.google.com", name: "Google Workspace", category: "Productivity & Docs" },
  { domain: "workspace.google.com", name: "Google Workspace", category: "Productivity & Docs" },
  { domain: "office.com", name: "Microsoft 365", category: "Productivity & Docs" },
  { domain: "microsoft.com", name: "Microsoft 365", category: "Productivity & Docs" },
  { domain: "airtable.com", name: "Airtable", category: "Productivity & Docs" },
  { domain: "miro.com", name: "Miro", category: "Design" },
  { domain: "canva.com", name: "Canva", category: "Design" },
  { domain: "stripe.com", name: "Stripe", category: "Finance & Accounting" },
  { domain: "quickbooks.intuit.com", name: "QuickBooks", category: "Finance & Accounting" },
  { domain: "intuit.com", name: "QuickBooks", category: "Finance & Accounting" },
  { domain: "xero.com", name: "Xero", category: "Finance & Accounting" },
  { domain: "gusto.com", name: "Gusto", category: "HR" },
  { domain: "rippling.com", name: "Rippling", category: "HR" },
  { domain: "bamboohr.com", name: "BambooHR", category: "HR" },
  { domain: "workday.com", name: "Workday", category: "HR" },
  { domain: "lattice.com", name: "Lattice", category: "HR" },
  { domain: "deel.com", name: "Deel", category: "HR" },
  { domain: "greenhouse.io", name: "Greenhouse", category: "HR" },
  { domain: "lever.co", name: "Lever", category: "HR" },
  { domain: "intercom.com", name: "Intercom", category: "Customer Support" },
  { domain: "zendesk.com", name: "Zendesk", category: "Customer Support" },
  { domain: "freshdesk.com", name: "Freshdesk", category: "Customer Support" },
  { domain: "helpscout.com", name: "Help Scout", category: "Customer Support" },
  { domain: "mixpanel.com", name: "Mixpanel", category: "Analytics & BI" },
  { domain: "amplitude.com", name: "Amplitude", category: "Analytics & BI" },
  { domain: "segment.com", name: "Segment", category: "Analytics & BI" },
  { domain: "looker.com", name: "Looker", category: "Analytics & BI" },
  { domain: "tableau.com", name: "Tableau", category: "Analytics & BI" },
  { domain: "datadog.com", name: "Datadog", category: "Dev Tools" },
  { domain: "pagerduty.com", name: "PagerDuty", category: "Dev Tools" },
  { domain: "sentry.io", name: "Sentry", category: "Dev Tools" },
  { domain: "vercel.com", name: "Vercel", category: "Cloud & Infrastructure" },
  { domain: "heroku.com", name: "Heroku", category: "Cloud & Infrastructure" },
  { domain: "aws.amazon.com", name: "AWS", category: "Cloud & Infrastructure" },
  { domain: "amazonaws.com", name: "AWS", category: "Cloud & Infrastructure" },
  { domain: "cloud.google.com", name: "Google Cloud", category: "Cloud & Infrastructure" },
  { domain: "azure.com", name: "Azure", category: "Cloud & Infrastructure" },
  { domain: "mailchimp.com", name: "Mailchimp", category: "Marketing" },
  { domain: "klaviyo.com", name: "Klaviyo", category: "Marketing" },
  { domain: "sendgrid.com", name: "SendGrid", category: "Marketing" },
  { domain: "marketo.com", name: "Marketo", category: "Marketing" },
  { domain: "apollo.io", name: "Apollo.io", category: "CRM & Sales" },
  { domain: "outreach.io", name: "Outreach", category: "CRM & Sales" },
  { domain: "gong.io", name: "Gong", category: "CRM & Sales" },
  { domain: "chorus.ai", name: "Chorus", category: "CRM & Sales" },
  { domain: "okta.com", name: "Okta", category: "Identity & Security" },
  { domain: "auth0.com", name: "Auth0", category: "Identity & Security" },
  { domain: "1password.com", name: "1Password", category: "Identity & Security" },
  { domain: "lastpass.com", name: "LastPass", category: "Identity & Security" },
  { domain: "notion.so", name: "Notion", category: "Productivity & Docs" },
  { domain: "craft.do", name: "Craft", category: "Productivity & Docs" },
  { domain: "coda.io", name: "Coda", category: "Productivity & Docs" },
  { domain: "confluence.atlassian.com", name: "Confluence", category: "Productivity & Docs" },
  { domain: "zapier.com", name: "Zapier", category: "Automation" },
  { domain: "make.com", name: "Make", category: "Automation" },
  { domain: "n8n.io", name: "n8n", category: "Automation" },
  { domain: "twilio.com", name: "Twilio", category: "Communication" },
  { domain: "plaid.com", name: "Plaid", category: "Finance & Accounting" },
  { domain: "contentful.com", name: "Contentful", category: "Content" },
  { domain: "webflow.com", name: "Webflow", category: "Content" },
  { domain: "wordpress.com", name: "WordPress", category: "Content" },
];

function extractDomains(text) {
  if (!text) return new Set();
  const urlRegex = /https?:\/\/([a-zA-Z0-9.-]+)/g;
  const emailRegex = /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const domains = new Set();
  let m;
  while ((m = urlRegex.exec(text)) !== null) domains.add(m[1].toLowerCase());
  while ((m = emailRegex.exec(text)) !== null) domains.add(m[1].toLowerCase());
  return domains;
}

function matchToolsFromDomains(domains) {
  const found = new Map();
  for (const domain of domains) {
    for (const tool of SAAS_DOMAIN_MAP) {
      if (domain.includes(tool.domain) || tool.domain.includes(domain)) {
        if (!found.has(tool.name)) {
          found.set(tool.name, tool);
        }
      }
    }
  }
  return Array.from(found.values());
}

function decodeBase64Url(str) {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

function extractEmailText(payload) {
  let text = '';
  if (payload.body?.data) {
    text += decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      text += extractEmailText(part);
    }
  }
  return text;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection('6a2c11c93a60aebc9a354fd8');

    const headers = { Authorization: `Bearer ${accessToken}` };

    // Fetch the 100 most recent emails (sent + received)
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=in:anywhere',
      { headers }
    );
    const listData = await listRes.json();
    if (!listRes.ok) {
      const permissionError = listRes.status === 403
        ? 'Gmail read permission is missing. Reconnect Gmail and approve read-only email access.'
        : `Gmail search failed (${listRes.status})`;
      throw new Error(listData?.error?.message || permissionError);
    }
    const messages = listData.messages || [];

    const allDomains = new Set();

    // Sample up to 50 messages for domain extraction
    const sample = messages.slice(0, 50);
    await Promise.all(sample.map(async ({ id }) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers }
      );
      if (!msgRes.ok) return;
      const msg = await msgRes.json();

      // Extract from headers (To, From, Cc)
      for (const h of msg.payload?.headers || []) {
        if (['to', 'from', 'cc', 'reply-to'].includes(h.name.toLowerCase())) {
          extractDomains(h.value).forEach((d) => allDomains.add(d));
        }
      }

      // Extract from body
      const bodyText = extractEmailText(msg.payload || {});
      extractDomains(bodyText).forEach((d) => allDomains.add(d));
    }));

    const detectedTools = matchToolsFromDomains(allDomains);

    return Response.json({ success: true, tools: detectedTools, scanned: sample.length });
  } catch (error) {
    return Response.json({ not_configured: true, error: error.message }, { status: 200 });
  }
}