const DAY_MS = 24 * 60 * 60 * 1000;
const cents = (value) => Math.round(value * 100) / 100;
const validNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function classifySeat(seat, policy, now = new Date()) {
  const threshold = policy.seasonal ? null : (policy.thresholdDays || 60);
  const assigned = seat.seat_status === 'assigned' && !!seat.assignment_verified_at;
  const windowDays = seat.observation_window_days ?? seat.activity_window_days ?? 0;
  const complete = threshold !== null && windowDays >= threshold;
  if (!assigned || seat.usage_supported !== true || seat.usage_verified !== true || seat.data_freshness_status !== 'fresh' || seat.sync_status !== 'succeeded') return 'INSUFFICIENT_EVIDENCE';
  const lastActivity = seat.last_activity_at || seat.last_verified_activity_at;
  if (!lastActivity || !complete) return 'INSUFFICIENT_EVIDENCE';
  const activityDate = new Date(lastActivity);
  if (Number.isNaN(activityDate.getTime()) || activityDate > now) return 'INSUFFICIENT_EVIDENCE';
  const daysSinceActivity = Math.floor((now.getTime() - activityDate.getTime()) / DAY_MS);
  if (daysSinceActivity > threshold * 2) return 'STRONG_DORMANCY_CANDIDATE';
  if (daysSinceActivity > threshold) return 'DORMANCY_CANDIDATE';
  if (daysSinceActivity > Math.floor(threshold * (policy.lowActivityFraction || 0.5)) || (seat.usage_event_count ?? seat.activity_event_count ?? 0) <= 1) return 'LOW_ACTIVITY';
  return 'ACTIVE';
}

export function normalizeBilling(record, field = 'amount') {
  if (!validNumber(record?.[field])) return { monthlyAmount: null, annualAmount: null, recurring: false, billingPeriod: 'unknown' };
  const amount = Number(record[field]);
  const period = String(record.billing_period || '').toLowerCase().trim();
  if (!period || period.includes('one-time') || period.includes('one time') || period.includes('lifetime')) return { monthlyAmount: null, annualAmount: null, recurring: false, billingPeriod: period || 'unknown' };
  let monthly;
  if (period.includes('annual') || period.includes('year')) monthly = amount / 12;
  else if (period.includes('quarter')) monthly = amount / 3;
  else if (period.includes('week')) monthly = amount * 52 / 12;
  else if (period.includes('month')) monthly = amount;
  else return { monthlyAmount: null, annualAmount: null, recurring: false, billingPeriod: period };
  return { monthlyAmount: cents(monthly), annualAmount: cents(monthly * 12), recurring: true, billingPeriod: period };
}

export const monthlyAmount = (record) => normalizeBilling(record).monthlyAmount;

function stableHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}

export function financialFingerprint(record) {
  const sourceDate = record.invoice_number || record.source_date || record.verified_at || '';
  return stableHash([record.organization_app_id, record.source_name || record.record_type, sourceDate, Number(record.amount), record.currency || 'USD', record.billing_period || 'unknown'].join('|').toLowerCase());
}

export function deduplicateFinancialRecords(records) {
  const seen = new Set();
  return records.filter((record) => { const key = record.source_fingerprint || record.evidence_id || financialFingerprint(record); if (seen.has(key)) return false; seen.add(key); return true; });
}

function isFinancialFresh(record, now) {
  if (record.valid_through) return new Date(record.valid_through) >= now;
  const verified = new Date(record.verified_at || record.source_date || record.created_date || 0);
  return !Number.isNaN(verified.getTime()) && (now - verified) / DAY_MS <= 400;
}

export function reconcileCurrentCost(records, now = new Date()) {
  const unique = deduplicateFinancialRecords(records);
  const current = unique.filter((record) => record.status !== 'superseded' && normalizeBilling(record).recurring && isFinancialFresh(record, now));
  const alternatives = current.map((record) => { const normalized = normalizeBilling(record); return { id: record.id, originalAmount: record.amount, amount: normalized.monthlyAmount, annualAmount: normalized.annualAmount, billingPeriod: normalized.billingPeriod, currency: record.currency || 'USD', source: record.source_name || record.record_type, verifiedAt: record.verified_at, validThrough: record.valid_through }; });
  if (!current.length) return { status: 'unknown', record: null, monthlyAmount: null, annualAmount: null, recurring: false, alternatives, duplicateCount: records.length - unique.length };
  const values = new Set(alternatives.map((item) => `${item.currency}:${Math.round(item.amount * 100)}`));
  if (values.size > 1) return { status: 'needs_review', record: null, monthlyAmount: null, annualAmount: null, recurring: false, alternatives, duplicateCount: records.length - unique.length };
  const selected = current.find((record) => record.authoritative === true && record.status === 'confirmed');
  if (selected) return { status: 'confirmed', record: selected, ...normalizeBilling(selected), alternatives, duplicateCount: records.length - unique.length };
  if (current.every((record) => record.status === 'confirmed')) {
    const latest = [...current].sort((a, b) => new Date(b.verified_at || b.created_date) - new Date(a.verified_at || a.created_date))[0];
    return { status: 'confirmed', record: latest, ...normalizeBilling(latest), alternatives, duplicateCount: records.length - unique.length };
  }
  return { status: 'needs_review', record: null, monthlyAmount: null, annualAmount: null, recurring: false, alternatives, duplicateCount: records.length - unique.length };
}

const uniqueSeats = (seats) => [...new Map(seats.map((seat) => [`${seat.organization_user_id || ''}:${seat.provider_seat_id || seat.id}`, seat])).values()];
const latestDate = (values) => values.filter(Boolean).sort().at(-1) || null;

export function calculateApplicationMetrics(app, seats, financialRecords) {
  const assigned = uniqueSeats(seats).filter((seat) => seat.seat_status === 'assigned');
  const sufficient = assigned.filter((seat) => seat.usage_classification !== 'INSUFFICIENT_EVIDENCE');
  const insufficient = assigned.filter((seat) => seat.usage_classification === 'INSUFFICIENT_EVIDENCE');
  const dormant = sufficient.filter((seat) => ['DORMANCY_CANDIDATE', 'STRONG_DORMANCY_CANDIDATE'].includes(seat.usage_classification));
  const active = sufficient.filter((seat) => ['ACTIVE', 'LOW_ACTIVITY'].includes(seat.usage_classification));
  const usageCoverage = assigned.length ? Math.min(100, Math.round((sufficient.length / assigned.length) * 100)) : 0;
  const cost = reconcileCurrentCost(financialRecords);
  const finance = cost.status === 'confirmed' ? cost.record : null;
  const marginal = finance ? normalizeBilling({ ...finance, amount: finance.marginal_unit_price }).monthlyAmount : null;
  const minimum = Math.max(0, Number(finance?.minimum_commitment) || 0);
  const reclaimableSeats = Math.min(dormant.length, Math.max(0, assigned.length - Math.max(active.length, minimum)));
  let savings = { classification: 'OPTIMIZATION_CANDIDATE', amount: null, annualAmount: null, reclaimableSeats: 0, method: cost.status === 'needs_review' ? 'cost conflict requires review' : 'insufficient current financial or usage evidence' };
  if (finance && marginal && finance.seat_reduction_changes_spend === true && reclaimableSeats > 0) savings = { classification: 'SAVINGS_READY_TO_CAPTURE', amount: cents(reclaimableSeats * marginal), annualAmount: cents(reclaimableSeats * marginal * 12), reclaimableSeats, method: 'verified reclaimable seats × normalized verified marginal seat cost' };
  else if (finance && marginal && dormant.length > 0) savings = { classification: 'RENEWAL_SAVINGS_OPPORTUNITY', amount: cents(dormant.length * marginal), annualAmount: cents(dormant.length * marginal * 12), reclaimableSeats: dormant.length, method: 'verified dormant seats × normalized verified marginal seat cost at renewal' };
  const evidence = { application: app.display_name, assignedSeats: assigned.length, reclaimableSeats: savings.reclaimableSeats, verifiedUnitCost: marginal, billingFrequency: finance?.billing_period || null, currency: finance?.currency || null, financialSource: finance?.source_name || finance?.record_type || null, financialVerifiedAt: finance?.verified_at || null, observationPeriodDays: dormant.length ? Math.min(...dormant.map((seat) => seat.observation_window_days || 0)) : null, lastQualifyingActivity: latestDate(dormant.map((seat) => seat.last_activity_at || seat.last_verified_activity_at)), activitySources: [...new Set(dormant.map((seat) => seat.activity_source).filter(Boolean))], lastSuccessfulSync: latestDate(dormant.map((seat) => seat.last_successful_sync_at)), dataFreshness: dormant.length && dormant.every((seat) => seat.data_freshness_status === 'fresh') ? 'fresh' : 'insufficient', calculation: savings.method, monthlySavings: savings.amount, annualSavings: savings.annualAmount };
  return { assignedSeats: assigned.length, activeSeats: active.length, dormantSeats: dormant.length, unknownSeats: insufficient.length, reclaimableSeats, verifiedAccessOnlySeats: assigned.filter((seat) => seat.evidence_level === 'VERIFIED_ACCESS' && seat.usage_verified !== true).length, insufficientEvidenceSeats: insufficient.length, usageCoverage, utilization: assigned.length && usageCoverage === 100 ? Math.round((active.length / assigned.length) * 100) : null, dormantApplication: assigned.length > 0 && usageCoverage === 100 && dormant.length === assigned.length, cost, savings, evidence };
}

export function calculateCoverage(apps) {
  const count = apps.length; const pct = (test) => count ? Math.round((apps.filter(test).length / count) * 100) : 0;
  const result = { inventory: pct((app) => app.ownership_status !== 'INSUFFICIENT_EVIDENCE'), access: pct((app) => app.access_status === 'VERIFIED_ACCESS'), usage: pct((app) => app.usage_status === 'VERIFIED_LIVE'), spend: pct((app) => app.financial_status === 'FINANCIAL_EVIDENCE'), contract: pct((app) => app.contract_status === 'CONTRACT_EVIDENCE') };
  result.overall = count ? Math.round(Object.values(result).reduce((sum, value) => sum + value, 0) / 5) : 0;
  return result;
}

export function validateMetrics(summary) {
  const issues = [];
  if (summary.dormantApplications > summary.totalApplications) issues.push({ rule: 'DORMANT_APPS_EXCEED_TOTAL', metric: 'dormantApplications' });
  if (summary.dormantSeats > summary.assignedSeats) issues.push({ rule: 'DORMANT_SEATS_EXCEED_ASSIGNED', metric: 'dormantSeats' });
  if ((summary.reclaimableSeats || 0) > summary.assignedSeats) issues.push({ rule: 'RECLAIMABLE_SEATS_EXCEED_ASSIGNED', metric: 'verifiedSavings' });
  if (summary.activeSeats + summary.dormantSeats + (summary.unknownSeats || 0) > summary.assignedSeats) issues.push({ rule: 'SEAT_COUNTS_EXCEED_ASSIGNED', metric: 'assignedSeats' });
  if (summary.usageCoverage > 100) issues.push({ rule: 'USAGE_COVERAGE_EXCEEDS_100', metric: 'usageCoverage' });
  if (summary.usageCoverage === 0 && summary.utilization !== null) issues.push({ rule: 'UTILIZATION_WITHOUT_USAGE', metric: 'utilization' });
  if (summary.verifiedSavings > 0 && !summary.hasVerifiedFinancialEvidence) issues.push({ rule: 'SAVINGS_WITHOUT_FINANCIAL_EVIDENCE', metric: 'verifiedSavings' });
  if (summary.verifiedSavings != null && summary.verifiedAnnualSavings != null && cents(summary.verifiedSavings * 12) !== cents(summary.verifiedAnnualSavings)) issues.push({ rule: 'MONTHLY_ANNUAL_MISMATCH', metric: 'verifiedSavings' });
  return issues;
}