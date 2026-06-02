// Per-tool guide for where to find API keys / OAuth credentials
// Fields: apiUrl, oauthUrl, steps[], docsUrl, notes
export const CREDENTIAL_GUIDES = {
  // Communication
  "Slack": {
    apiUrl: "https://api.slack.com/apps",
    oauthUrl: "https://api.slack.com/apps",
    steps: ["Go to api.slack.com/apps → Create New App", "Under 'OAuth & Permissions', add scopes", "Install app to workspace and copy Bot Token"],
    docsUrl: "https://api.slack.com/authentication/token-types",
  },
  "Microsoft Teams": {
    apiUrl: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    steps: ["Go to Azure Portal → App Registrations → New registration", "Add API permissions for Microsoft Graph", "Create a client secret under Certificates & Secrets"],
    docsUrl: "https://learn.microsoft.com/en-us/graph/auth-register-app-v2",
  },
  "Zoom": {
    apiUrl: "https://marketplace.zoom.us/develop/create",
    steps: ["Go to Zoom Marketplace → Develop → Build App", "Choose 'Server-to-Server OAuth' app type", "Copy Account ID, Client ID, and Client Secret"],
    docsUrl: "https://developers.zoom.us/docs/internal-apps/",
  },
  "Google Meet": {
    apiUrl: "https://console.cloud.google.com/apis/credentials",
    steps: ["Go to Google Cloud Console → APIs & Services → Credentials", "Create OAuth 2.0 Client ID", "Enable the Google Calendar API for Meet data"],
    docsUrl: "https://developers.google.com/workspace/guides/create-credentials",
  },
  "Loom": {
    apiUrl: "https://www.loom.com/settings/integrations",
    steps: ["Go to Loom Settings → Integrations", "Contact Loom for API access (enterprise only)"],
    docsUrl: "https://support.loom.com/",
    notes: "API access requires an Enterprise plan.",
  },
  "Webex": {
    apiUrl: "https://developer.webex.com/my-apps",
    steps: ["Go to developer.webex.com → My Webex Apps → Create a New App", "Choose 'Integration' for OAuth", "Copy Client ID and Client Secret"],
    docsUrl: "https://developer.webex.com/docs/integrations",
  },
  "RingCentral": {
    apiUrl: "https://developers.ringcentral.com/my-account.html#/applications",
    steps: ["Log in to RingCentral Developer Console", "Create a new App → choose JWT or Auth Code flow", "Copy Client ID and Client Secret"],
    docsUrl: "https://developers.ringcentral.com/guide/authentication",
  },
  "Intercom": {
    apiUrl: "https://app.intercom.com/a/apps/_/settings/api-keys",
    steps: ["Go to Intercom Settings → Integrations → API Keys", "Create a new Access Token"],
    docsUrl: "https://developers.intercom.com/docs/build-an-integration/learn-more/authentication/",
  },
  "Front": {
    apiUrl: "https://app.frontapp.com/settings/developers",
    steps: ["Go to Front Settings → Developers → API Tokens", "Create a new API Token with required scopes"],
    docsUrl: "https://dev.frontapp.com/docs/getting-started-with-the-front-api",
  },

  // Project Management
  "Asana": {
    apiUrl: "https://app.asana.com/0/my-apps",
    oauthUrl: "https://app.asana.com/0/my-apps",
    steps: ["Go to Asana → Profile → My Apps", "Create a new Personal Access Token, or create an OAuth app"],
    docsUrl: "https://developers.asana.com/docs/authentication",
  },
  "Jira": {
    apiUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
    steps: ["Go to id.atlassian.com → Security → API Tokens", "Create and copy your API Token", "Use with your Atlassian email as Basic Auth"],
    docsUrl: "https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/",
  },
  "Monday.com": {
    apiUrl: "https://monday.com/settings/api",
    steps: ["Go to Monday.com Profile → Developers → My Access Tokens", "Copy your personal API token"],
    docsUrl: "https://developer.monday.com/api-reference/docs/authentication",
  },
  "Trello": {
    apiUrl: "https://trello.com/app-key",
    steps: ["Go to trello.com/app-key to get your API Key", "Generate a Token by clicking the 'Token' link on the same page"],
    docsUrl: "https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/",
  },
  "ClickUp": {
    apiUrl: "https://app.clickup.com/settings/apps",
    steps: ["Go to ClickUp Settings → Apps", "Generate a Personal API Token"],
    docsUrl: "https://clickup.com/api/developer-portal/authentication/",
  },
  "Linear": {
    apiUrl: "https://linear.app/settings/api",
    steps: ["Go to Linear Settings → API → Personal API Keys", "Create a new key"],
    docsUrl: "https://developers.linear.app/docs/graphql/working-with-the-graphql-api#personal-api-keys",
  },
  "Notion": {
    apiUrl: "https://www.notion.so/my-integrations",
    steps: ["Go to notion.so/my-integrations → New Integration", "Copy the Internal Integration Secret", "Share your databases/pages with the integration"],
    docsUrl: "https://developers.notion.com/docs/authorization",
  },
  "Airtable": {
    apiUrl: "https://airtable.com/create/tokens",
    steps: ["Go to airtable.com/create/tokens", "Create a Personal Access Token with required scopes"],
    docsUrl: "https://airtable.com/developers/web/guides/personal-access-tokens",
  },
  "Smartsheet": {
    apiUrl: "https://app.smartsheet.com/b/home#2061501930247556",
    steps: ["Go to Smartsheet Account → Apps & Integrations → API Access", "Generate a new access token"],
    docsUrl: "https://smartsheet.redoc.ly/#section/API-Basics/OAuth-Flows",
  },
  "Basecamp": {
    apiUrl: "https://launchpad.37signals.com/integrations",
    steps: ["Go to 37signals Launchpad → Integrations → Register an App", "Use OAuth 2.0 with your Client ID and Secret"],
    docsUrl: "https://github.com/basecamp/api/blob/master/sections/authentication.md",
  },
  "Wrike": {
    apiUrl: "https://www.wrike.com/frontend/apps/index.html#/api",
    steps: ["Go to Wrike Apps & Integrations → API → Create New App", "Copy Client ID and Client Secret"],
    docsUrl: "https://developers.wrike.com/oauth-20-authorization/",
  },

  // CRM & Sales
  "Salesforce": {
    apiUrl: "https://login.salesforce.com",
    oauthUrl: "https://login.salesforce.com",
    steps: ["Go to Setup → App Manager → New Connected App", "Enable OAuth settings, add scopes", "Copy Consumer Key (Client ID) and Consumer Secret"],
    docsUrl: "https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm",
    notes: "Requires System Administrator profile to create Connected Apps.",
  },
  "HubSpot": {
    apiUrl: "https://app.hubspot.com/profile-preferences/integrations/private-apps",
    oauthUrl: "https://app.hubspot.com/developer/",
    steps: ["Go to HubSpot Settings → Integrations → Private Apps", "Create a Private App and select required scopes", "Copy the generated Access Token"],
    docsUrl: "https://developers.hubspot.com/docs/api/private-apps",
  },
  "Pipedrive": {
    apiUrl: "https://app.pipedrive.com/settings/api",
    steps: ["Go to Pipedrive Settings → Personal Preferences → API", "Copy your personal API token"],
    docsUrl: "https://developers.pipedrive.com/docs/api/v1",
  },
  "Zoho CRM": {
    apiUrl: "https://api-console.zoho.com/",
    steps: ["Go to api-console.zoho.com → Add Client → Server-based Applications", "Authorize and get OAuth tokens"],
    docsUrl: "https://www.zoho.com/crm/developer/docs/api/v5/oauth-overview.html",
  },
  "Apollo.io": {
    apiUrl: "https://app.apollo.io/#/settings/integrations/api",
    steps: ["Go to Apollo Settings → Integrations → API", "Create and copy your API Key"],
    docsUrl: "https://apolloio.github.io/apollo-api-docs/",
  },
  "Outreach": {
    apiUrl: "https://api.outreach.io/api/v2/",
    oauthUrl: "https://developers.outreach.io/",
    steps: ["Go to Outreach → Settings → Your Apps → Create App", "Configure OAuth 2.0 and copy credentials"],
    docsUrl: "https://developers.outreach.io/api/",
  },
  "Salesloft": {
    apiUrl: "https://accounts.salesloft.com/oauth/applications",
    steps: ["Go to Salesloft Settings → API → OAuth Applications", "Create a new app and copy Client ID / Secret"],
    docsUrl: "https://developers.salesloft.com/api.html#!/Topic/APIKey",
  },
  "Gong": {
    apiUrl: "https://app.gong.io/settings/api",
    steps: ["Go to Gong Settings → API → Create", "Copy Access Key and Access Key Secret"],
    docsUrl: "https://help.gong.io/hc/en-us/articles/360044525952",
    notes: "Requires Technical Administrator role.",
  },
  "ZoomInfo": {
    apiUrl: "https://api.zoominfo.com/",
    steps: ["Contact ZoomInfo support for API access", "Obtain Client ID, Client Secret, and Username"],
    docsUrl: "https://api.zoominfo.com/",
    notes: "API access requires a paid plan with API add-on.",
  },
  "Drift": {
    apiUrl: "https://dev.drift.com/apps",
    steps: ["Go to Drift Developer → Apps → New App", "Enable OAuth and copy credentials"],
    docsUrl: "https://devdocs.drift.com/docs/",
  },

  // Productivity & Docs
  "Google Workspace": {
    apiUrl: "https://console.cloud.google.com/apis/credentials",
    steps: ["Go to Google Cloud Console → APIs & Services → Credentials", "Create OAuth 2.0 credentials or a Service Account", "Enable required Workspace APIs (Admin SDK, Gmail, Drive, etc.)"],
    docsUrl: "https://developers.google.com/workspace/guides/create-credentials",
  },
  "Microsoft 365": {
    apiUrl: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    steps: ["Go to Azure Active Directory → App Registrations → New Registration", "Add Microsoft Graph permissions", "Create a Client Secret"],
    docsUrl: "https://learn.microsoft.com/en-us/graph/auth-register-app-v2",
  },
  "Confluence": {
    apiUrl: "https://id.atlassian.com/manage-profile/security/api-tokens",
    steps: ["Same as Jira — go to id.atlassian.com → API Tokens", "Use your Atlassian email + token as Basic Auth"],
    docsUrl: "https://developer.atlassian.com/cloud/confluence/basic-auth-for-rest-apis/",
  },
  "Notion Academy": {
    apiUrl: "https://www.notion.so/my-integrations",
    steps: ["Same as Notion — go to notion.so/my-integrations", "Create an internal integration and copy the secret"],
    docsUrl: "https://developers.notion.com/",
  },

  // Dev Tools
  "GitHub": {
    apiUrl: "https://github.com/settings/tokens",
    oauthUrl: "https://github.com/settings/developers",
    steps: ["Go to GitHub Settings → Developer Settings → Personal Access Tokens", "Generate a new token (classic or fine-grained) with required scopes"],
    docsUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
  },
  "GitLab": {
    apiUrl: "https://gitlab.com/-/user_settings/personal_access_tokens",
    steps: ["Go to GitLab Settings → Access Tokens", "Create a Personal Access Token with required scopes"],
    docsUrl: "https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html",
  },
  "Datadog": {
    apiUrl: "https://app.datadoghq.com/organization-settings/api-keys",
    steps: ["Go to Datadog Organization Settings → API Keys", "Create a new API Key and Application Key"],
    docsUrl: "https://docs.datadoghq.com/account_management/api-app-keys/",
  },
  "Sentry": {
    apiUrl: "https://sentry.io/settings/account/api/auth-tokens/",
    steps: ["Go to Sentry Settings → Account → API → Auth Tokens", "Create a new token with required scopes"],
    docsUrl: "https://docs.sentry.io/api/auth/",
  },
  "PagerDuty": {
    apiUrl: "https://support.pagerduty.com/docs/generating-api-keys",
    steps: ["Go to PagerDuty → My Profile → User Settings → Create API User Token", "Or create a General Access API Key under Integrations → API Access Keys"],
    docsUrl: "https://developer.pagerduty.com/api-reference/",
  },
  "Vercel": {
    apiUrl: "https://vercel.com/account/tokens",
    steps: ["Go to Vercel Account Settings → Tokens", "Create a new token"],
    docsUrl: "https://vercel.com/docs/rest-api#introduction/api-basics/authentication",
  },
  "Supabase": {
    apiUrl: "https://supabase.com/dashboard/account/tokens",
    steps: ["Go to Supabase Dashboard → Account → Access Tokens", "Generate a new access token"],
    docsUrl: "https://supabase.com/docs/reference/api/introduction",
  },
  "Retool": {
    apiUrl: "https://docs.retool.com/docs/api-authentication",
    steps: ["Go to Retool Settings → API → Generate token"],
    docsUrl: "https://docs.retool.com/docs/api-authentication",
  },
  "Amplitude": {
    apiUrl: "https://app.amplitude.com/analytics/settings/projects",
    steps: ["Go to Amplitude Settings → Projects → select project → General", "Copy the API Key and Secret Key"],
    docsUrl: "https://www.docs.developers.amplitude.com/analytics/apis/",
  },
  "Mixpanel": {
    apiUrl: "https://mixpanel.com/settings/project",
    steps: ["Go to Mixpanel Project Settings → Access Keys", "Copy the Project Token and Service Account credentials"],
    docsUrl: "https://developer.mixpanel.com/reference/authentication",
  },

  // Analytics & BI
  "Google Analytics": {
    apiUrl: "https://console.cloud.google.com/apis/credentials",
    steps: ["Go to Google Cloud Console → APIs → Enable Google Analytics Data API", "Create a Service Account and download JSON key"],
    docsUrl: "https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries",
  },
  "Segment": {
    apiUrl: "https://app.segment.com/goto-my-workspace/settings/access-management",
    steps: ["Go to Segment Settings → Access Management → Tokens", "Create a Public API token"],
    docsUrl: "https://segment.com/docs/config-api/authentication/",
  },
  "Heap": {
    apiUrl: "https://heapanalytics.com/app/account",
    steps: ["Go to Heap Account Settings → API", "Copy your App ID and generate API credentials"],
    docsUrl: "https://developers.heap.io/reference/authentication",
  },

  // Marketing
  "Mailchimp": {
    apiUrl: "https://admin.mailchimp.com/account/api/",
    steps: ["Go to Mailchimp Profile → Extras → API Keys", "Create a new API key"],
    docsUrl: "https://mailchimp.com/developer/marketing/guides/quick-start/",
  },
  "Klaviyo": {
    apiUrl: "https://www.klaviyo.com/account#api-keys-tab",
    steps: ["Go to Klaviyo Account → Settings → API Keys", "Create a Private API Key with required scopes"],
    docsUrl: "https://developers.klaviyo.com/en/docs/retrieve_api_credentials",
  },
  "ActiveCampaign": {
    apiUrl: "https://help.activecampaign.com/hc/en-us/articles/207317590",
    steps: ["Go to ActiveCampaign Settings → Developer → API Access", "Copy your API URL and Key"],
    docsUrl: "https://developers.activecampaign.com/reference/authentication",
  },
  "Marketo": {
    apiUrl: "https://nation.marketo.com/t5/knowledgebase/how-to-create-an-api-only-user/ta-p/253628",
    steps: ["Go to Marketo Admin → LaunchPoint → New Service", "Create an API-only user and copy Client ID / Secret"],
    docsUrl: "https://developers.marketo.com/rest-api/",
  },
  "Semrush": {
    apiUrl: "https://www.semrush.com/accounts/profile/subscription",
    steps: ["Go to SEMrush Subscription → API Units → Get API Key"],
    docsUrl: "https://developer.semrush.com/api/basics/auth/",
    notes: "API access requires a paid plan.",
  },
  "Typeform": {
    apiUrl: "https://admin.typeform.com/user/tokens",
    steps: ["Go to Typeform Admin → Profile → Personal tokens", "Create a new token"],
    docsUrl: "https://developer.typeform.com/get-started/",
  },

  // Customer Support
  "Zendesk": {
    apiUrl: "https://{subdomain}.zendesk.com/admin/apps-integrations/apis/zendesk-api/settings",
    steps: ["Go to Zendesk Admin → Apps & Integrations → APIs → Zendesk API", "Enable Token Access and create an API Token", "Use your email/token for Basic Auth"],
    docsUrl: "https://developer.zendesk.com/api-reference/introduction/security-and-auth/",
  },
  "Freshdesk": {
    apiUrl: "https://{subdomain}.freshdesk.com/profile",
    steps: ["Go to Freshdesk Profile Settings (top-right avatar)", "Find Your API Key at the bottom of the page"],
    docsUrl: "https://developers.freshdesk.com/api/#authentication",
  },
  "Help Scout": {
    apiUrl: "https://secure.helpscout.net/settings/oauth/clients/",
    steps: ["Go to Help Scout My Profile → API Keys or create an OAuth2 App under Settings", "Copy Client ID and Secret"],
    docsUrl: "https://developer.helpscout.com/mailbox-api/overview/authentication/",
  },

  // Finance
  "QuickBooks": {
    apiUrl: "https://developer.intuit.com/app/developer/myapps",
    steps: ["Go to developer.intuit.com → My Apps → Create an App", "Copy Client ID and Client Secret from Keys & Credentials"],
    docsUrl: "https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization",
  },
  "Xero": {
    apiUrl: "https://developer.xero.com/app/manage",
    steps: ["Go to developer.xero.com → Apps → New App", "Copy Client ID and Client Secret"],
    docsUrl: "https://developer.xero.com/documentation/guides/oauth2/auth-flow/",
  },
  "Stripe": {
    apiUrl: "https://dashboard.stripe.com/apikeys",
    steps: ["Go to Stripe Dashboard → Developers → API Keys", "Copy the Secret Key (use Restricted Keys for least-privilege)"],
    docsUrl: "https://stripe.com/docs/api/authentication",
  },
  "Expensify": {
    apiUrl: "https://www.expensify.com/tools/integrations/",
    steps: ["Go to expensify.com/tools/integrations to generate your partnerUserID and partnerUserSecret"],
    docsUrl: "https://integrations.expensify.com/Integration-Server/doc/",
  },
  "Chargebee": {
    apiUrl: "https://app.chargebee.com/api_keys",
    steps: ["Go to Chargebee Settings → API Keys → Create a Key"],
    docsUrl: "https://apidocs.chargebee.com/docs/api?prod_cat_ver=2#authentication",
  },
  "Recurly": {
    apiUrl: "https://app.recurly.com/login#/developers/api_access",
    steps: ["Go to Recurly Developer → API Access → Generate Private API Key"],
    docsUrl: "https://developers.recurly.com/api/",
  },

  // Identity & Security
  "Okta": {
    apiUrl: "https://{subdomain}.okta.com/admin/access/api/tokens",
    oauthUrl: "https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/",
    steps: ["Go to Okta Admin → Security → API → Tokens", "Create a new API Token", "Or create an OAuth Service App for machine-to-machine auth"],
    docsUrl: "https://developer.okta.com/docs/reference/api/",
  },
  "1Password": {
    apiUrl: "https://my.1password.com/integrations/infrastructure-secrets/",
    steps: ["Go to 1Password → Integrations → Infrastructure Secrets Management", "Create a new integration token"],
    docsUrl: "https://developer.1password.com/docs/connect/",
    notes: "Requires 1Password Business plan.",
  },

  // HR
  "BambooHR": {
    apiUrl: "https://{subdomain}.bamboohr.com/settings/page/user_access_tokens",
    steps: ["Go to BambooHR Profile Icon → API Keys", "Add a new API Key"],
    docsUrl: "https://documentation.bamboohr.com/docs",
  },
  "Greenhouse": {
    apiUrl: "https://app.greenhouse.io/configure/dev_center/credentials",
    steps: ["Go to Greenhouse Dev Center → API Credential Management → Create New Credential"],
    docsUrl: "https://developers.greenhouse.io/harvest.html#authentication",
  },
  "Gusto": {
    apiUrl: "https://dev.gusto.com/",
    steps: ["Go to dev.gusto.com → Create Application → Get Client ID & Secret"],
    docsUrl: "https://docs.gusto.com/app-integrations/docs/authentication",
  },
  "Workday": {
    apiUrl: "https://community.workday.com/sites/default/files/file-hosting/productionapi/index.html",
    steps: ["Contact your Workday Admin to set up an Integration System User (ISU)", "Create an OAuth 2.0 API Client under Tenant Setup"],
    docsUrl: "https://community.workday.com/sites/default/files/file-hosting/productionapi/index.html",
    notes: "Requires Workday Admin access. API setup is done in the Workday tenant.",
  },
  "Lattice": {
    apiUrl: "https://lattice.com/library/how-to-use-the-lattice-api",
    steps: ["Go to Lattice Settings → Integrations → API → Generate API Token"],
    docsUrl: "https://developers.lattice.com/",
  },
  "Rippling": {
    apiUrl: "https://app.rippling.com/api",
    steps: ["Contact Rippling support or go to Settings → API to request access", "Rippling uses OAuth 2.0 for partner integrations"],
    docsUrl: "https://developer.rippling.com/",
    notes: "API access requires approval from Rippling.",
  },
  "Calendly": {
    apiUrl: "https://calendly.com/integrations/api_webhooks",
    steps: ["Go to Calendly Integrations → API & Webhooks", "Generate a Personal Access Token"],
    docsUrl: "https://developer.calendly.com/api-docs/",
  },

  // Dev Tools (more)
  "Bitbucket": {
    apiUrl: "https://bitbucket.org/account/settings/app-passwords/new",
    steps: ["Go to Bitbucket Personal Settings → App Passwords → Create", "Select required permissions and copy the password"],
    docsUrl: "https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication",
  },
  "CircleCI": {
    apiUrl: "https://app.circleci.com/settings/user/tokens",
    steps: ["Go to CircleCI User Settings → Personal API Tokens → Create New Token"],
    docsUrl: "https://circleci.com/docs/managing-api-tokens/",
  },
  "New Relic": {
    apiUrl: "https://one.newrelic.com/api-keys",
    steps: ["Go to New Relic → (All capabilities) → API Keys → Create a key"],
    docsUrl: "https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/",
  },
  "LaunchDarkly": {
    apiUrl: "https://app.launchdarkly.com/settings/authorization",
    steps: ["Go to LaunchDarkly Account Settings → Authorization → Access Tokens → Create Token"],
    docsUrl: "https://docs.launchdarkly.com/home/connecting/api",
  },

  // Cloud
  "AWS": {
    apiUrl: "https://us-east-1.console.aws.amazon.com/iam/home#/users",
    steps: ["Go to AWS IAM → Users → Create User with programmatic access", "Attach required policies and copy Access Key ID and Secret"],
    docsUrl: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html",
  },
  "Google Cloud": {
    apiUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    steps: ["Go to Google Cloud → IAM & Admin → Service Accounts → Create Service Account", "Create and download a JSON key"],
    docsUrl: "https://cloud.google.com/iam/docs/keys-create-delete",
  },
  "Microsoft Azure": {
    apiUrl: "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
    steps: ["Register an App in Azure AD → Certificates & Secrets → New client secret", "Note the Application (Client) ID and Directory (Tenant) ID"],
    docsUrl: "https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal",
  },
  "Cloudflare": {
    apiUrl: "https://dash.cloudflare.com/profile/api-tokens",
    steps: ["Go to Cloudflare Dashboard → Profile → API Tokens → Create Token"],
    docsUrl: "https://developers.cloudflare.com/fundamentals/api/",
  },

  // Customer Success
  "Gainsight": {
    apiUrl: "https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs/Gainsight_APIs/API_Documentation/01REST_API/01Getting_Started_with_Gainsight_REST_API",
    steps: ["Go to Gainsight Admin → Integrations → Connectors 2.0 → API", "Generate an Access Key"],
    docsUrl: "https://support.gainsight.com/Gainsight_NXT/API_and_Developer_Docs",
  },
  "Pendo": {
    apiUrl: "https://app.pendo.io/admin",
    steps: ["Go to Pendo Settings → Integrations → API Keys → Add Integration Key"],
    docsUrl: "https://developers.pendo.io/docs/",
  },

  // Automation
  "Zapier": {
    apiUrl: "https://zapier.com/app/developer",
    steps: ["Go to zapier.com/app/developer to create a Zapier App for OAuth", "Or use Zapier's built-in integrations — no API key needed for standard use"],
    docsUrl: "https://platform.zapier.com/reference/zapier-platform-schema",
  },
  "Make": {
    apiUrl: "https://www.make.com/en/api-documentation",
    steps: ["Go to Make → Profile → API → Generate API Token"],
    docsUrl: "https://www.make.com/en/api-documentation",
  },

  // Storage
  "Dropbox": {
    apiUrl: "https://www.dropbox.com/developers/apps",
    steps: ["Go to dropbox.com/developers → App Console → Create App", "Generate an Access Token or use OAuth 2.0"],
    docsUrl: "https://developers.dropbox.com/oauth-guide",
  },
  "Box": {
    apiUrl: "https://app.box.com/developers/console",
    steps: ["Go to Box Developer Console → Create New App → Custom App", "Choose Server Authentication (OAuth 2.0) and copy credentials"],
    docsUrl: "https://developer.box.com/guides/authentication/",
  },
};

const DEFAULT_GUIDE = {
  steps: ["Search for '[Tool Name] API documentation' in your browser", "Look for a Developer Settings, API Keys, or Integrations section in the tool's Settings", "Generate an API token or create an OAuth app with the required permissions"],
  notes: "Refer to the tool's official documentation for the most up-to-date instructions.",
};

export function getCredentialGuide(toolName) {
  return CREDENTIAL_GUIDES[toolName] || DEFAULT_GUIDE;
}