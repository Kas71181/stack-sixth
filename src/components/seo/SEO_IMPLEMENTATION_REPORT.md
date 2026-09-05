# StackSixth Technical SEO, AEO, and Search Readiness Report

Date: 2026-09-05  
Primary market: United States  
Canonical origin: https://stacksixth.com

## 1. Initial audit summary

- Framework: React 18 with JavaScript, Vite, Tailwind CSS, React Router, and Base44 hosting/BaaS.
- Rendering: interactive pages are client-rendered; Base44 automatically supplies fully rendered HTML to search and AI crawlers after publishing.
- Routing: 14 public marketing/legal routes, public authentication routes, and protected application routes.
- Deployment: Base44 production hosting; an additional Vercel SPA rewrite file exists in the repository.
- Strong baseline: production homepage HTML contains the visible content; public routes use real links; every audited public page has one H1; no public image lacked alt text; HTTPS and www-to-non-www redirects are active.
- Material findings: seven public routes shared fallback metadata; FAQ schema appeared on pages without visible FAQs; private/unknown routes were not comprehensively noindexed; the header logo lacked intrinsic dimensions; a broken manifest reference returned a branded 404; the generated sitemap contained non-evidenced lastmod, priority, and changefreq signals; trailing-slash duplicates and missing URLs return HTTP 200 in production.

## 2. Technical changes implemented

1. Added a single page metadata map for every existing public route.
2. Added unique titles, descriptions, canonicals, Open Graph, and Twitter metadata.
3. Changed robots handling to an allowlist: only known public pages are indexable; every other route defaults to `noindex,nofollow`.
4. Replaced global structured data with page-specific JSON-LD.
5. Limited FAQPage markup to the pricing page, where the complete FAQ is visible.
6. Added Organization, WebSite, SoftwareApplication, WebPage, AboutPage, and ContactPage data where accurate.
7. Added verified logo dimensions and social-image dimensions.
8. Removed the broken web-manifest reference.
9. Corrected the announcement destination to a crawlable root-page fragment URL.
10. Added accessible names for comparison-table status icons.
11. Added route-level JavaScript loading for secondary public pages, authentication, and private application pages.
12. Added source-controlled robots.txt, sitemap.xml, and experimental llms.txt files.

## 3. Files created or modified

Created:
- `src/lib/seoConfig.js`
- `src/lib/structuredData.js`
- `src/lib/pricingFaqContent.js`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/llms.txt`
- `src/components/seo/SEO_IMPLEMENTATION_REPORT.md`
- `src/components/seo/CONTENT_RECOMMENDATIONS_REQUIRING_APPROVAL.md`

Modified:
- `src/components/SeoManager.jsx`
- `src/components/pricing/PricingFAQ.jsx`
- `src/components/pricing/FeatureComparison.jsx`
- `src/components/marketing/PublicNavbar.jsx`
- `src/components/marketing/AnnouncementBar.jsx`
- `src/App.jsx`
- `index.html`

## 4. Before-and-after findings

| Check | Before | After |
|---|---:|---:|
| Public routes with unique titles | 8/14 | 14/14 |
| Public routes with unique descriptions | 8/14 | 14/14 |
| Public routes with self-referencing canonicals | 14/14 | 14/14 |
| Public routes with one H1 | 14/14 | 14/14 |
| Global inaccurate FAQ schema | Present | Removed |
| Pages with valid visible-FAQ schema | 0 | Pricing only |
| Unknown/private route default | Potentially indexable | `noindex,nofollow` |
| Public images missing alt | 0 | 0 |
| Header logo missing intrinsic size | Yes | No |
| Broken manifest reference | Present | Removed |
| Duplicate title/description pairs | 7 routes | None |
| Runtime console errors in verification | 0 | 0 |
| Horizontal overflow, desktop/mobile | None | None |

## 5. Existing-page keyword and metadata map

| URL | Purpose / intent | Primary keyword | Supporting themes | SEO title | Internal links / content gap |
|---|---|---|---|---|---|
| `/` | Product discovery | AI software procurement platform | SaaS spend management; software stack management | StackSixth \| AI Software Procurement & SaaS Management | Links to pricing and homepage sections; broader category education requires approval |
| `/product` | Product evaluation | software procurement intelligence | software stack audit; software cost optimization | AI Software Procurement Platform \| StackSixth | Links to pricing and contact sales; limited standalone depth |
| `/features` | Feature evaluation | SaaS management platform | software renewal management; subscription management | SaaS Spend Management Features \| StackSixth | Links to pricing and contact sales; limited feature detail |
| `/how-it-works` | Process evaluation | software procurement platform | optimize a software stack; software purchasing platform | How StackSixth Software Procurement Works | Links to pricing and contact sales; limited process depth |
| `/integrations` | Integration evaluation | software procurement integrations | SaaS management integrations | Software Procurement Integrations \| StackSixth | Links to pricing and contact sales; provider-specific details require approval |
| `/pricing` | Transactional plan comparison | SaaS management pricing | SaaS spend management plans | StackSixth Pricing \| SaaS Management Plans | Links to checkout/contact sales; sufficient transactional purpose |
| `/about` | Brand/entity research | software procurement intelligence | SaaS management company | About StackSixth \| Software Procurement Intelligence | Links to pricing and contact sales; company-story depth requires approval |
| `/contact` | Navigational contact | contact StackSixth | software management support | Contact StackSixth \| Software Management Support | Links to contact sales and pricing |
| `/contact-sales` | Commercial enquiry | SaaS spend management sales | software procurement platform demo | Contact StackSixth Sales \| SaaS Spend Management | Existing form; preserve conversion labels |
| `/faq` | Informational support | StackSixth FAQ | SaaS billing; integrations; renewals | StackSixth FAQ \| SaaS Spend Management Answers | Page currently has introductory copy only; visible FAQs require approval before FAQ schema |
| `/privacy` | Trust/legal | StackSixth privacy policy | data security; privacy | StackSixth Privacy Policy \| Data and Security | Legal review still required |
| `/terms` | Trust/legal | StackSixth terms of service | service terms | StackSixth Terms of Service | Legal review still required |
| `/cookies` | Trust/legal | StackSixth cookie policy | website cookies | StackSixth Cookie Policy | Legal review still required |
| `/acceptable-use` | Trust/legal | StackSixth acceptable use policy | acceptable use | StackSixth Acceptable Use Policy | Legal review still required |

Every canonical is the absolute non-www HTTPS URL shown by its route, with no query parameters and no trailing slash except the root URL.

## 6. Structured-data implementation

- Homepage: Organization, WebSite, SoftwareApplication, and WebPage.
- About: AboutPage.
- Contact and Contact Sales: ContactPage.
- Pricing: WebPage and FAQPage using the exact visible pricing FAQs.
- Other public routes: WebPage.
- No ratings, reviews, customers, awards, founders, employee counts, or unverified claims were added.
- JSON parsing passed in browser verification. Google Rich Results Test and Schema.org Validator should be run against the published URLs after deployment.

## 7. Robots, sitemap, and llms.txt

- robots.txt allows public crawling, explicitly allows OAI-SearchBot and PerplexityBot, disallows technical API/function paths, and declares the canonical sitemap.
- GPTBot policy was intentionally not added or changed; approval is required before making a model-training policy decision.
- sitemap.xml contains only the 14 existing canonical public routes and omits fake lastmod, priority, and changefreq values.
- llms.txt is treated as experimental and contains only factual brand information and existing authoritative public URLs.
- The production versions currently return HTTP 200. The newly source-controlled versions must be confirmed after the next publish because the preview server did not serve newly added public files.

## 8. Performance and Core Web Vitals

Implemented:
- Route-level code splitting for secondary marketing, authentication, and application routes.
- Intrinsic logo dimensions to reduce layout-shift risk.
- Removal of a guaranteed 404 manifest request.
- Existing reduced-motion support preserved.

Verified:
- No desktop or mobile horizontal overflow.
- No runtime console errors in the audited views.
- Responsive visual appearance preserved.

Not asserted without measurement:
- Numerical Lighthouse and field Core Web Vitals scores. Run Lighthouse mobile tests on the published homepage, pricing, product, and contact-sales pages, then monitor CrUX/Search Console field data.

## 9. Accessibility results

- One H1 on every public route.
- Existing skip link and semantic header/nav/main/footer landmarks preserved.
- Public image alt text present.
- Header image dimensions added.
- Contact form labels remain explicitly associated with controls.
- Icon-only navigation control retains an accessible name and expanded state.
- Comparison-table check/minus states now expose accessible names.
- Keyboard-native anchors, buttons, details, form controls, dialogs, and menus preserved.
- No color changes were made. Any contrast remediation requiring a brand-color change needs approval.

## 10. Search Console setup

1. Add `stacksixth.com` as a Domain property in Google Search Console.
2. Copy Google's DNS TXT verification value exactly into the domain's DNS provider; do not invent a token.
3. Verify the property after DNS propagation.
4. Submit `https://stacksixth.com/sitemap.xml`.
5. Inspect `/`, `/product`, `/features`, `/pricing`, `/integrations`, and `/contact-sales`.
6. Request indexing after the optimized build is published.
7. Monitor Pages, Sitemaps, Enhancements, Core Web Vitals, HTTPS, and manual actions.

## 11. Bing Webmaster Tools and IndexNow

Bing:
1. Add and verify `https://stacksixth.com` in Bing Webmaster Tools, either through DNS or a verified Search Console import.
2. Submit `https://stacksixth.com/sitemap.xml`.
3. Review Site Scan, URL Inspection, Index Explorer, crawl errors, and backlinks.

IndexNow:
1. Generate an IndexNow key in Bing Webmaster Tools.
2. Host the exact key file at the root or use the supported key-location field.
3. Submit only canonical public URLs when they are created, updated, moved, or deleted.
4. Never submit private/authentication URLs.
5. Store the key as a secret if automated submissions are later approved; no placeholder token was added.

## 12. Analytics, conversions, and AI referral tracking

- Keep the existing Base44 analytics tracker; do not install a duplicate script.
- Existing events include homepage trial CTA selection, pricing plan selection, promo entry, and contact-sales submission.
- Before adding GA4, confirm the Measurement ID and inspect production for an existing Google tag.
- Recommended additional event mapping, without changing labels: Request Demo, Enter Your Stack, signup start/completion, contact submission, checkout start/completion, and primary CTA click.
- Create a GA4 exploration with Session source/medium, Landing page, Engaged sessions, Key events, and Revenue.
- Use a regex source segment for `chatgpt.com|perplexity.ai|copilot.microsoft.com|gemini.google.com` and expand as new verified referrers appear.
- Preserve inbound UTM parameters; group `utm_source=chatgpt.com` and equivalent values without overwriting them.

## 13. Security and search quality

- Production HTTPS works; HTTP and www redirect directly to `https://stacksixth.com/` with 308 responses.
- No mixed-content issue was observed in the audited public pages.
- Private and unknown routes now receive `noindex,nofollow` metadata.
- Existing authentication and application access controls were not changed.
- Security headers managed by Base44 should be reviewed in the Security dashboard. Do not add disruptive CSP rules without integration testing.
- Production currently returns HTTP 200 for trailing-slash duplicates and unknown paths. Canonicals/noindex reduce indexing risk, but true edge-level redirects and 404 responses require platform/domain configuration.

## 14. 30-, 60-, and 90-day monitoring plan

### First 30 days
- Publish and confirm metadata, JSON-LD, robots.txt, sitemap.xml, and llms.txt on production.
- Verify Search Console and Bing Webmaster Tools.
- Submit sitemap and inspect priority URLs.
- Run Lighthouse mobile tests and Rich Results/Schema validators.
- Record baseline impressions, clicks, indexed pages, branded queries, non-branded queries, and AI referrals.

### Days 31-60
- Review crawl/index exclusions and duplicate URL reports.
- Confirm trailing-slash and soft-404 platform fixes.
- Compare title/description CTR by page without changing visible copy.
- Review Core Web Vitals field data.
- Approve or reject the highest-priority content opportunities separately.

### Days 61-90
- Evaluate keyword-to-page alignment using real query data.
- Expand approved content only where Search Console demonstrates demand.
- Review internal links, AI referral landing pages, conversion rates, and assisted conversions.
- Refresh sitemap only when real public routes change.
- Re-run technical, accessibility, structured-data, and broken-link checks.

## 15. Remaining manual actions and missing information

1. Publish the app and verify the three root crawl files return the new content and correct content types.
2. In the Domains dashboard, configure trailing-slash normalization and true 404 handling if supported.
3. Run Google Rich Results Test and Schema.org Validator against published URLs.
4. Run Lighthouse/PageSpeed Insights on representative mobile pages.
5. Provide Google Search Console and Bing verification tokens only when issued.
6. Confirm whether GA4 is desired and provide its Measurement ID.
7. Generate an IndexNow key if automated URL submission is desired.
8. Supply an approved 1200×630 Open Graph image and PNG Apple touch/web app icons; the current approved logo is 300×137.
9. Complete qualified legal review of the published legal placeholders.
10. Decide whether GPTBot should be allowed or disallowed; OAI-SearchBot remains allowed independently.

## 16. Verification statement

All 14 public routes were compared against pre-change visible-copy hashes. Every public-page hash matched after route content finished loading. No visible wording, section, color, typography, layout, image, animation, pricing value, form label, placeholder, navigation label, legal statement, or application function was changed. Desktop and mobile screenshots showed the existing design intact.