import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── COMPREHENSIVE TOOL LINK MAP ───────────────────────────────────────────
// Every tool in the Stack Sixth catalog mapped to its real pricing/signup page.
// `program` indicates a known affiliate/partner program — enroll and add your
// tracked URL to the AffiliateLink entity to override the direct link below.
// Matching is case-insensitive on the tool name.
const TOOL_LINKS = {
  // ── Communication ──
  "slack":              { url: "https://slack.com/pricing", program: null },
  "microsoft teams":    { url: "https://www.microsoft.com/en-us/microsoft-teams/group-chat-software", program: null },
  "zoom":               { url: "https://zoom.us/pricing", program: null },
  "google meet":        { url: "https://workspace.google.com/products/meet/", program: null },
  "loom":               { url: "https://www.loom.com/pricing", program: null },
  "discord":            { url: "https://discord.com/nitro", program: null },
  "webex":              { url: "https://www.webex.com/pricing.html", program: null },
  "ringcentral":        { url: "https://www.ringcentral.com/plansandpricing.html", program: null },
  "dialpad":            { url: "https://www.dialpad.com/pricing/", program: null },
  "intercom":           { url: "https://www.intercom.com/pricing", program: null },
  "front":              { url: "https://front.com/pricing", program: null },

  // ── Project Management ──
  "asana":              { url: "https://asana.com/pricing", program: null },
  "jira":               { url: "https://www.atlassian.com/software/jira/pricing", program: null },
  "monday.com":         { url: "https://monday.com/pricing", program: "PartnerStack" },
  "trello":             { url: "https://trello.com/pricing", program: null },
  "clickup":            { url: "https://clickup.com/pricing", program: "Direct — clickup.com/partners" },
  "linear":             { url: "https://linear.app/pricing", program: null },
  "basecamp":           { url: "https://basecamp.com/pricing", program: "Direct — basecamp.com/affiliates" },
  "wrike":              { url: "https://www.wrike.com/price/", program: null },
  "smartsheet":         { url: "https://www.smartsheet.com/pricing", program: null },
  "notion":             { url: "https://www.notion.so/pricing", program: null },
  "coda":               { url: "https://coda.io/pricing", program: null },
  "airtable":           { url: "https://airtable.com/pricing", program: null },
  "height":             { url: "https://height.app/pricing", program: null },
  "shortcut":           { url: "https://app.shortcut.com/signup", program: null },
  "plane":              { url: "https://plane.so/pricing", program: null },

  // ── CRM & Sales ──
  "salesforce":         { url: "https://www.salesforce.com/editions-pricing/overview/", program: null },
  "hubspot":            { url: "https://www.hubspot.com/pricing", program: "Direct — hubspot.com/affiliates" },
  "pipedrive":          { url: "https://www.pipedrive.com/en/pricing", program: "PartnerStack" },
  "zoho crm":           { url: "https://www.zoho.com/crm/pricing.html", program: "Direct — zoho.com/affiliates" },
  "close":              { url: "https://www.close.com/pricing", program: "Direct — close.com/affiliates" },
  "freshsales":         { url: "https://www.freshworks.com/crm/pricing/", program: "Direct — freshworks.com/partners" },
  "copper":             { url: "https://www.copper.com/pricing", program: null },
  "apollo.io":          { url: "https://www.apollo.io/pricing", program: null },
  "outreach":           { url: "https://www.outreach.io/pricing", program: null },
  "salesloft":          { url: "https://salesloft.com/pricing", program: null },
  "gong":               { url: "https://www.gong.io/pricing/", program: null },
  "chorus":             { url: "https://www.gong.io/", program: null },
  "zoominfo":           { url: "https://www.zoominfo.com/pricing", program: null },
  "clearbit":           { url: "https://clearbit.com/pricing", program: null },
  "drift":              { url: "https://www.drift.com/pricing", program: null },

  // ── Productivity & Docs ──
  "google workspace":   { url: "https://workspace.google.com/pricing.html", program: null },
  "microsoft 365":      { url: "https://www.microsoft.com/en-us/microsoft-365/business/compare-all-plans", program: null },
  "confluence":         { url: "https://www.atlassian.com/software/confluence/pricing", program: null },
  "dropbox paper":      { url: "https://www.dropbox.com/paper", program: null },
  "quip":               { url: "https://quip.com/about/price", program: null },
  "slite":              { url: "https://slite.com/pricing", program: null },
  "gitbook":            { url: "https://www.gitbook.com/pricing", program: null },
  "tettra":             { url: "https://tettra.com/pricing/", program: null },
  "guru":               { url: "https://www.getguru.com/pricing", program: null },

  // ── Design ──
  "figma":              { url: "https://www.figma.com/pricing/", program: null },
  "adobe creative cloud": { url: "https://www.adobe.com/creativecloud/plans.html", program: "Impact" },
  "sketch":             { url: "https://www.sketch.com/pricing/", program: null },
  "canva":              { url: "https://www.canva.com/pricing/", program: "Impact" },
  "invision":           { url: "https://www.invisionapp.com/", program: null },
  "zeplin":             { url: "https://zeplin.io/pricing", program: null },
  "abstract":           { url: "https://www.goabstract.com/pricing", program: null },
  "framer":             { url: "https://www.framer.com/pricing", program: "Direct — framer.com/affiliates" },
  "maze":               { url: "https://maze.co/pricing/", program: null },
  "hotjar":             { url: "https://www.hotjar.com/pricing/", program: "Direct — hotjar.com/affiliates" },
  "miro":               { url: "https://miro.com/pricing/", program: null },
  "whimsical":          { url: "https://whimsical.com/pricing", program: null },
  "lucidchart":         { url: "https://www.lucidchart.com/pages/pricing", program: "Direct — lucidchart.com/affiliates" },

  // ── Dev Tools ──
  "github":             { url: "https://github.com/pricing", program: null },
  "gitlab":             { url: "https://about.gitlab.com/pricing/", program: null },
  "bitbucket":          { url: "https://www.atlassian.com/software/bitbucket/pricing", program: null },
  "circleci":           { url: "https://circleci.com/pricing/", program: null },
  "jenkins":            { url: "https://www.jenkins.io/", program: null },
  "datadog":            { url: "https://www.datadoghq.com/pricing/", program: null },
  "new relic":          { url: "https://newrelic.com/pricing", program: null },
  "sentry":             { url: "https://sentry.io/pricing/", program: null },
  "pagerduty":          { url: "https://www.pagerduty.com/pricing/", program: null },
  "postman":            { url: "https://www.postman.com/pricing/", program: null },
  "vercel":             { url: "https://vercel.com/pricing", program: null },
  "netlify":            { url: "https://www.netlify.com/pricing/", program: null },
  "heroku":             { url: "https://www.heroku.com/pricing", program: null },
  "docker":             { url: "https://www.docker.com/pricing/", program: null },
  "terraform":          { url: "https://www.terraform.io/", program: null },
  "snyk":               { url: "https://snyk.io/plans/", program: null },
  "launchdarkly":       { url: "https://launchdarkly.com/pricing/", program: null },
  "split.io":           { url: "https://www.split.io/pricing", program: null },
  "retool":             { url: "https://retool.com/pricing", program: null },
  "supabase":           { url: "https://supabase.com/pricing", program: null },
  "firebase":           { url: "https://firebase.google.com/pricing", program: null },
  "amplitude":          { url: "https://amplitude.com/pricing", program: null },
  "mixpanel":           { url: "https://mixpanel.com/pricing/", program: null },

  // ── Cloud & Infrastructure ──
  "aws":                { url: "https://aws.amazon.com/pricing/", program: null },
  "google cloud":       { url: "https://cloud.google.com/pricing", program: null },
  "microsoft azure":    { url: "https://azure.microsoft.com/en-us/pricing/", program: null },
  "cloudflare":         { url: "https://www.cloudflare.com/plans/", program: null },
  "fastly":             { url: "https://www.fastly.com/pricing", program: null },
  "digitalocean":       { url: "https://www.digitalocean.com/pricing", program: "Direct — digitalocean.com/partners" },
  "linode":             { url: "https://www.linode.com/pricing/", program: "Direct — akamai.com/partners" },

  // ── Storage ──
  "dropbox":            { url: "https://www.dropbox.com/plans", program: null },
  "box":                { url: "https://www.box.com/pricing", program: null },
  "google drive":       { url: "https://workspace.google.com/products/drive/", program: null },
  "onedrive":           { url: "https://www.microsoft.com/en-us/microsoft-365/onedrive/online-cloud-storage", program: null },
  "sharepoint":         { url: "https://www.microsoft.com/en-us/microsoft-365/sharepoint/collaboration", program: null },

  // ── Marketing ──
  "mailchimp":          { url: "https://mailchimp.com/pricing/", program: "Direct — mailchimp.com/affiliates" },
  "klaviyo":            { url: "https://www.klaviyo.com/pricing", program: null },
  "activecampaign":     { url: "https://www.activecampaign.com/pricing", program: "Direct — activecampaign.com/affiliates" },
  "marketo":            { url: "https://business.adobe.com/products/marketo/pricing.html", program: null },
  "pardot":             { url: "https://www.salesforce.com/form/marketingcloud-demo/", program: null },
  "brevo":              { url: "https://www.brevo.com/pricing/", program: "Direct — brevo.com/affiliates" },
  "constant contact":   { url: "https://www.constantcontact.com/pricing", program: "Direct — constantcontact.com/affiliates" },
  "convertkit":         { url: "https://convertkit.com/pricing", program: "Direct — convertkit.com/affiliates" },
  "drip":               { url: "https://www.drip.com/pricing", program: "Direct — drip.com/affiliates" },
  "customer.io":        { url: "https://customer.io/pricing/", program: "Direct — customer.io/affiliates" },
  "iterable":           { url: "https://iterable.com/pricing", program: null },
  "braze":              { url: "https://www.braze.com/pricing", program: null },
  "semrush":            { url: "https://www.semrush.com/pricing/", program: "Direct — semrush.com/affiliates" },
  "ahrefs":             { url: "https://ahrefs.com/pricing", program: "Direct — ahrefs.com/affiliate" },
  "moz":                { url: "https://moz.com/products/pricing", program: "Direct — moz.com/affiliates" },
  "sprout social":      { url: "https://sproutsocial.com/pricing/", program: null },
  "hootsuite":          { url: "https://www.hootsuite.com/plans", program: "Direct — hootsuite.com/affiliates" },
  "buffer":             { url: "https://buffer.com/pricing", program: "Direct — buffer.com/affiliates" },
  "later":              { url: "https://later.com/pricing/", program: "Direct — later.com/affiliates" },
  "google ads":         { url: "https://ads.google.com/", program: null },
  "unbounce":           { url: "https://unbounce.com/pricing/", program: "Direct — unbounce.com/affiliates" },
  "typeform":           { url: "https://www.typeform.com/pricing/", program: "PartnerStack" },
  "surveymonkey":       { url: "https://www.surveymonkey.com/pricing/", program: "CJ Affiliate" },
  "optimizely":         { url: "https://www.optimizely.com/pricing/", program: null },
  "vwo":                { url: "https://vwo.com/pricing/", program: "Direct — vwo.com/affiliates" },

  // ── Analytics & BI ──
  "google analytics":   { url: "https://analytics.google.com/", program: null },
  "tableau":            { url: "https://www.tableau.com/pricing", program: null },
  "looker":             { url: "https://cloud.google.com/looker/pricing", program: null },
  "power bi":           { url: "https://powerbi.microsoft.com/en-us/pricing/", program: null },
  "domo":               { url: "https://www.domo.com/pricing", program: null },
  "metabase":           { url: "https://www.metabase.com/pricing", program: null },
  "mode":               { url: "https://mode.com/pricing/", program: null },
  "heap":               { url: "https://heap.io/pricing", program: null },
  "fullstory":          { url: "https://www.fullstory.com/pricing", program: null },
  "segment":            { url: "https://segment.com/pricing/", program: null },
  "rudderstack":        { url: "https://www.rudderstack.com/pricing", program: null },

  // ── Customer Support ──
  "zendesk":            { url: "https://www.zendesk.com/pricing/", program: null },
  "freshdesk":          { url: "https://www.freshworks.com/freshdesk/pricing/", program: "Direct — freshworks.com/partners" },
  "help scout":         { url: "https://www.helpscout.com/pricing/", program: "Direct — helpscout.com/affiliates" },
  "groove":             { url: "https://www.groovehq.com/pricing", program: "Direct — groovehq.com/affiliates" },
  "livechat":           { url: "https://www.livechat.com/pricing/", program: "Direct — livechat.com/affiliates" },
  "tidio":              { url: "https://www.tidio.com/pricing/", program: "Direct — tidio.com/affiliates" },
  "crisp":              { url: "https://crisp.chat/en/pricing/", program: null },
  "kustomer":           { url: "https://www.kustomer.com/pricing", program: null },
  "gladly":             { url: "https://www.gladly.com/pricing/", program: null },

  // ── HR & People ──
  "bamboohr":           { url: "https://www.bamboohr.com/pricing/", program: null },
  "workday":            { url: "https://www.workday.com/pricing/", program: null },
  "gusto":              { url: "https://gusto.com/pricing", program: "Direct — gusto.com/affiliates" },
  "rippling":           { url: "https://www.rippling.com/pricing", program: null },
  "lattice":            { url: "https://lattice.com/pricing", program: null },
  "culture amp":        { url: "https://www.cultureamp.com/pricing", program: null },
  "15five":             { url: "https://www.15five.com/pricing", program: null },
  "lever":              { url: "https://www.lever.co/pricing", program: null },
  "greenhouse":         { url: "https://www.greenhouse.io/pricing", program: null },
  "workable":           { url: "https://www.workable.com/pricing/", program: null },
  "jobvite":            { url: "https://www.jobvite.com/", program: null },
  "calendly":           { url: "https://calendly.com/pricing", program: null },
  "officevibe":         { url: "https://officevibe.com/pricing", program: null },

  // ── Finance & Accounting ──
  "quickbooks":         { url: "https://quickbooks.intuit.com/pricing/", program: "Direct — quickbooks.intuit.com/affiliates" },
  "xero":               { url: "https://www.xero.com/us/pricing/", program: "Direct — xero.com/affiliates" },
  "freshbooks":         { url: "https://www.freshbooks.com/pricing", program: "Direct — freshbooks.com/affiliates" },
  "wave":               { url: "https://www.waveapps.com/pricing", program: null },
  "stripe":             { url: "https://stripe.com/pricing", program: null },
  "brex":               { url: "https://www.brex.com/pricing", program: null },
  "ramp":               { url: "https://ramp.com/pricing", program: null },
  "expensify":          { url: "https://www.expensify.com/pricing", program: null },
  "bill.com":           { url: "https://www.bill.com/pricing", program: null },
  "sage":               { url: "https://www.sage.com/en-us/pricing/", program: null },
  "netsuite":           { url: "https://www.netsuite.com/portal/netsuite-pricing-main.shtml", program: null },
  "recurly":            { url: "https://recurly.com/pricing/", program: null },
  "chargebee":          { url: "https://www.chargebee.com/pricing/", program: "Direct — chargebee.com/affiliates" },

  // ── Identity & Security ──
  "okta":               { url: "https://www.okta.com/pricing/", program: null },
  "auth0":              { url: "https://auth0.com/pricing", program: null },
  "onelogin":           { url: "https://onelogin.com/pricing", program: null },
  "jumpcloud":          { url: "https://jumpcloud.com/pricing", program: null },
  "1password":          { url: "https://1password.com/pricing/", program: "Direct — 1password.com/affiliates" },
  "lastpass":           { url: "https://www.lastpass.com/pricing", program: null },
  "dashlane":           { url: "https://www.dashlane.com/pricing", program: "Direct — dashlane.com/affiliates" },
  "vanta":              { url: "https://www.vanta.com/pricing", program: null },
  "drata":              { url: "https://drata.com/pricing", program: null },
  "crowdstrike":        { url: "https://www.crowdstrike.com/pricing/", program: null },
  "sophos":             { url: "https://www.sophos.com/en-us/pricing", program: null },

  // ── E-commerce ──
  "shopify":            { url: "https://www.shopify.com/pricing", program: "Direct — shopify.com/affiliates" },
  "woocommerce":        { url: "https://woocommerce.com/pricing/", program: null },
  "bigcommerce":        { url: "https://www.bigcommerce.com/pricing/", program: "Direct — bigcommerce.com/affiliates" },
  "magento":            { url: "https://business.adobe.com/products/magento/pricing.html", program: null },
  "gorgias":            { url: "https://www.gorgias.com/pricing", program: null },
  "recharge":           { url: "https://rechargepayments.com/pricing", program: null },
  "yotpo":              { url: "https://www.yotpo.com/pricing/", program: null },

  // ── Video & Content ──
  "youtube":            { url: "https://www.youtube.com/", program: null },
  "wistia":             { url: "https://wistia.com/pricing", program: null },
  "vimeo":              { url: "https://vimeo.com/upgrade", program: "Direct — vimeo.com/affiliates" },
  "vidyard":            { url: "https://www.vidyard.com/pricing/", program: null },
  "descript":           { url: "https://www.descript.com/pricing", program: null },
  "riverside.fm":       { url: "https://riverside.fm/pricing", program: null },
  "contentful":         { url: "https://www.contentful.com/pricing/", program: null },
  "wordpress":          { url: "https://wordpress.com/pricing/", program: null },
  "webflow":            { url: "https://webflow.com/pricing", program: "Direct — webflow.com/affiliates" },
  "hubspot cms":        { url: "https://www.hubspot.com/pricing/cms", program: "Direct — hubspot.com/affiliates" },

  // ── Automation ──
  "zapier":             { url: "https://zapier.com/pricing", program: "Direct — zapier.com/affiliates" },
  "make":               { url: "https://www.make.com/en/pricing", program: "Direct — make.com/affiliates" },
  "n8n":                { url: "https://n8n.io/pricing/", program: null },
  "workato":            { url: "https://www.workato.com/pricing", program: null },
  "boomi":              { url: "https://boomi.com/pricing", program: null },
  "tray.io":            { url: "https://tray.io/pricing", program: null },
  "celigo":             { url: "https://www.celigo.com/pricing/", program: null },
  "mulesoft":           { url: "https://www.mulesoft.com/pricing", program: null },

  // ── Learning ──
  "udemy for business": { url: "https://business.udemy.com/pricing/", program: "Direct — udemy.com/affiliates" },
  "coursera for teams": { url: "https://www.coursera.org/teams", program: "Direct — coursera.org/affiliates" },
  "linkedin learning":  { url: "https://www.linkedin.com/learning/", program: null },
  "pluralsight":        { url: "https://www.pluralsight.com/pricing", program: "Impact" },
  "notion academy":     { url: "https://www.notion.so/learn", program: null },

  // ── Customer Success ──
  "gainsight":          { url: "https://www.gainsight.com/pricing/", program: null },
  "churnzero":          { url: "https://churnzero.net/pricing/", program: null },
  "totango":            { url: "https://www.totango.com/pricing", program: null },
  "catalyst":           { url: "https://catalyst.io/pricing", program: null },
  "vitally":            { url: "https://vitally.io/pricing", program: null },
  "planhat":            { url: "https://www.planhat.com/pricing", program: null },
  "pendo":              { url: "https://pendo.io/pricing/", program: null },
  "walkme":             { url: "https://www.walkme.com/pricing", program: null },
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
      return Response.json({ url: null, is_affiliate: false, program: null });
    }

    const key = tool_name.toLowerCase().trim();

    // 1. Check AffiliateLink entity for a dynamic override (admin-managed)
    try {
      const overrides = await base44.asServiceRole.entities.AffiliateLink.filter(
        { tool_name: { $regex: key, $options: "i" } },
        "-created_date",
        1
      );
      if (overrides.length > 0 && overrides[0].affiliate_url) {
        return Response.json({
          url: overrides[0].affiliate_url,
          is_affiliate: true,
          program: overrides[0].notes || "Custom",
        });
      }
    } catch { /* entity lookup failed — fall through to map */ }

    // 2. Fall back to the comprehensive map
    const entry = TOOL_LINKS[key];
    if (entry) {
      return Response.json({
        url: entry.url,
        is_affiliate: !!entry.program,
        program: entry.program,
      });
    }

    // 3. No match found
    return Response.json({ url: null, is_affiliate: false, program: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});