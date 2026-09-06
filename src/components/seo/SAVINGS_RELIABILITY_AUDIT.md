# Savings & Recommendations Reliability Audit

## Existing paths
- Savings: OrganizationApp/ApplicationSeat/FinancialRecord/EvidenceRecord → `getEvidenceAnalytics` → shared evidence calculations → Savings overview and evidence views.
- Recommendations: SoftwareAudit customer input → `generateSoftwareAudit` AI candidate generation → nested audit result → Recommendations tab, comparison, reports, cart, and ROI views.
- Decisions: Recommendations tab previously updated the nested SoftwareAudit result directly in the browser.

## Findings and resolutions
1. **Zero telemetry could become dormancy.** Seat classification checked for a missing activity timestamp before requiring verified usage. Fixed: verified assignment, supported telemetry, verified usage, successful sync, fresh data, a complete observation window, and a valid qualifying activity timestamp are all mandatory.
2. **Billing normalization was permissive.** Unknown periods defaulted to monthly, invalid amounts became zero, annual marginal seat prices were not normalized, and one-time expenses could be treated as recurring. Fixed with strict monthly/quarterly/annual/weekly normalization; unknown and one-time periods are unpriced.
3. **Duplicate and overlapping records could inflate values.** Canonical application grouping did not consistently include duplicate-app financial records, and financial rows lacked a durable fingerprint. Fixed with canonical aggregation, seat deduplication, financial fingerprints, and one opportunity per canonical application.
4. **Cost freshness and currency conflicts were incomplete.** Fixed: expired/stale evidence is excluded, differing currencies/normalized values require review, and authoritative resolutions retain originals plus resolver, timestamp, frequency, currency, and audit history.
5. **Savings provenance was not inspectable.** Added lightweight View Evidence details for verified opportunities: units, normalized cost, billing, observation window, last activity, sources, sync/freshness, and formula.
6. **Coverage could be misunderstood.** Usage coverage counts only qualifying verified telemetry; connections/access do not improve usage coverage. Overall coverage remains the equal-weight average of inventory, access, usage, financial, and contract evidence.
7. **AI controlled financial and scoring claims.** AI previously supplied price, match score, savings, ROI, integrations, priority, timing, and migration risk. Fixed: AI is candidate discovery only; unsupported fields are suppressed. Match weighting is documented as functional fit 30%, requirements 20%, integrations 15%, cost 15%, migration 10%, company/stack compatibility 10%; no score is shown until those inputs are supported.
8. **Recommendation freshness was implicit.** Recommendations now carry an audit evidence snapshot and are marked stale/revalidation-required when the current stack differs or a legacy audit has no snapshot.
9. **Decision persistence lacked a server guard and audit trail.** Fixed with an authenticated, owner-scoped backend decision path, timestamps, actor tracking, optional decline reasons, defer options, and reload-safe persistence.
10. **Approve could be confused with realized savings.** The model now separates not realized, ready to capture, and captured; approval never marks savings captured.
11. **Affiliate neutrality lacked disclosure.** Affiliate status is not an engine input; purchasing actions disclose potential referral compensation.
12. **Tenant risks.** Customer records remain owner-scoped by RLS, and service-role operations are preceded by authenticated owner filters. New recommendation reads/decisions verify audit ownership server-side.

## Remaining evidence limitations
- Product catalog prices are directional estimates, not verified vendor quotes, so they are not used for verified recommendation savings or ROI.
- Functional capabilities, required integrations, and migration complexity do not yet have a verified product-data source; Match Score therefore shows “Insufficient data.”
- Historical AI reports are hardened on read; raw advisory output is retained in the audit record for traceability but is not used as source-of-truth.