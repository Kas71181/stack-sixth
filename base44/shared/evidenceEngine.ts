const DAY_MS = 24 * 60 * 60 * 1000;

export function classifySeat(seat, policy, now = new Date()) {
  const threshold = policy.seasonal ? null : (policy.thresholdDays || 60);
  const hasVerifiedAssignment = seat.seat_status === 'assigned' && !!seat.assignment_verified_at;
  const usageSupported = seat.usage_supported === true;
  const windowDays = seat.observation_window_days ?? seat.activity_window_days ?? 0;
  const hasCoverage = threshold !== null && windowDays >= threshold;
  const fresh = seat.data_freshness_status === 'fresh';
  const syncSucceeded = seat.sync_status === 'succeeded';
  if (!hasVerifiedAssignment || !usageSupported || !fresh || !syncSucceeded) return 'INSUFFICIENT_EVIDENCE';
  const lastActivity = seat.last_activity_at || seat.last_verified_activity_at;
  if (!lastActivity) return hasCoverage ? (windowDays >= threshold * 2 ? 'STRONG_DORMANCY_CANDIDATE' : 'DORMANCY_CANDIDATE') : 'INSUFFICIENT_EVIDENCE';
  if (seat.usage_verified !== true) return 'INSUFFICIENT_EVIDENCE';
  const daysSinceActivity = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / DAY_MS);
  if (daysSinceActivity > threshold * 2) return hasCoverage ? 'STRONG_DORMANCY_CANDIDATE' : 'INSUFFICIENT_EVIDENCE';
  if (daysSinceActivity > threshold) return hasCoverage ? 'DORMANCY_CANDIDATE' : 'INSUFFICIENT_EVIDENCE';
  const lowActivityThreshold = Math.floor(threshold * (policy.lowActivityFraction || 0.5));
  if (daysSinceActivity > lowActivityThreshold || (seat.usage_event_count ?? seat.activity_event_count ?? 0) <= 1) return 'LOW_ACTIVITY';
  return 'ACTIVE';
}

export function monthlyAmount(record) {
  const amount = Number(record.amount) || 0;
  const period = String(record.billing_period || 'monthly').toLowerCase();
  if (period.includes('annual') || period.includes('year')) return amount / 12;
  if (period.includes('quarter')) return amount / 3;
  if (period.includes('week')) return amount * 52 / 12;
  return amount;
}

export function reconcileCurrentCost(records) {
  const current = records.filter((record) => record.status !== 'superseded' && (!record.valid_through || new Date(record.valid_through) >= new Date()));
  const selected = current.find((record) => record.authoritative === true && record.status === 'confirmed');
  const alternatives = current.map((record) => ({ id: record.id, amount: monthlyAmount(record), source: record.source_name || record.record_type, verifiedAt: record.verified_at }));
  if (selected) return { status: 'confirmed', record: selected, monthlyAmount: monthlyAmount(selected), alternatives };
  if (!current.length) return { status: 'unknown', record: null, monthlyAmount: null, alternatives: [] };
  const values = new Set(alternatives.map((item) => Math.round(item.amount * 100)));
  if (values.size === 1) {
    const latest = [...current].sort((a, b) => new Date(b.verified_at || b.created_date) - new Date(a.verified_at || a.created_date))[0];
    return { status: 'confirmed', record: latest, monthlyAmount: monthlyAmount(latest), alternatives };
  }
  return { status: 'needs_review', record: null, monthlyAmount: null, alternatives };
}

export function calculateApplicationMetrics(app, seats, financialRecords) {
  const assigned = seats.filter((seat) => seat.seat_status === 'assigned');
  const sufficient = assigned.filter((seat) => seat.usage_classification !== 'INSUFFICIENT_EVIDENCE');
  const accessOnly = assigned.filter((seat) => seat.evidence_level === 'VERIFIED_ACCESS' && seat.usage_verified !== true);
  const insufficient = assigned.filter((seat) => seat.usage_classification === 'INSUFFICIENT_EVIDENCE');
  const dormant = sufficient.filter((seat) => ['DORMANCY_CANDIDATE', 'STRONG_DORMANCY_CANDIDATE'].includes(seat.usage_classification));
  const active = sufficient.filter((seat) => ['ACTIVE', 'LOW_ACTIVITY'].includes(seat.usage_classification));
  const usageCoverage = assigned.length ? Math.min(100, Math.round((sufficient.length / assigned.length) * 100)) : 0;
  const utilization = assigned.length > 0 && usageCoverage === 100 ? Math.round((active.length / assigned.length) * 100) : null;
  const dormantApplication = assigned.length > 0 && usageCoverage === 100 && dormant.length === assigned.length;
  const cost = reconcileCurrentCost(financialRecords.filter((record) => record.organization_app_id === app.id));
  const finance = cost.status === 'confirmed' ? cost.record : null;
  const marginalCost = finance?.marginal_unit_price || 0;
  const minimum = finance?.minimum_commitment || 0;
  const reducibleSeats = Math.max(0, assigned.length - Math.max(active.length, minimum));
  const reclaimableSeats = Math.min(dormant.length, reducibleSeats);
  let savings = { classification: 'OPTIMIZATION_CANDIDATE', amount: null, reclaimableSeats: 0, method: cost.status === 'needs_review' ? 'cost conflict requires review' : 'insufficient financial evidence' };
  if (finance && marginalCost > 0 && finance.seat_reduction_changes_spend && reclaimableSeats > 0) savings = { classification: 'SAVINGS_READY_TO_CAPTURE', amount: reclaimableSeats * marginalCost, reclaimableSeats, method: 'verified reclaimable seats × verified marginal seat cost' };
  else if (finance && marginalCost > 0 && dormant.length > 0) savings = { classification: 'RENEWAL_SAVINGS_OPPORTUNITY', amount: dormant.length * marginalCost, reclaimableSeats: dormant.length, method: 'verified dormant seats × verified marginal seat cost at renewal' };
  return { assignedSeats: assigned.length, activeSeats: active.length, dormantSeats: dormant.length, unknownSeats: insufficient.length, verifiedAccessOnlySeats: accessOnly.length, insufficientEvidenceSeats: insufficient.length, usageCoverage, utilization, dormantApplication, cost, savings };
}

export function calculateCoverage(apps) {
  const count = apps.length;
  const pct = (predicate) => count ? Math.round((apps.filter(predicate).length / count) * 100) : 0;
  const result = {
    inventory: pct((app) => app.ownership_status !== 'INSUFFICIENT_EVIDENCE'),
    access: pct((app) => app.access_status === 'VERIFIED_ACCESS'),
    usage: pct((app) => app.usage_status === 'VERIFIED_LIVE'),
    spend: pct((app) => app.financial_status === 'FINANCIAL_EVIDENCE'),
    contract: pct((app) => app.contract_status === 'CONTRACT_EVIDENCE')
  };
  result.overall = count ? Math.round(Object.values(result).reduce((sum, value) => sum + value, 0) / 5) : 0;
  return result;
}

export function validateMetrics(summary) {
  const issues = [];
  if (summary.dormantApplications > summary.totalApplications) issues.push({ rule: 'DORMANT_APPS_EXCEED_TOTAL', metric: 'dormantApplications' });
  if (summary.dormantSeats > summary.assignedSeats) issues.push({ rule: 'DORMANT_SEATS_EXCEED_ASSIGNED', metric: 'dormantSeats' });
  if (summary.activeSeats + summary.dormantSeats + (summary.unknownSeats || 0) > summary.assignedSeats) issues.push({ rule: 'SEAT_COUNTS_EXCEED_ASSIGNED', metric: 'assignedSeats' });
  if (summary.usageCoverage > 100) issues.push({ rule: 'USAGE_COVERAGE_EXCEEDS_100', metric: 'usageCoverage' });
  if (summary.usageCoverage === 0 && summary.utilization !== null) issues.push({ rule: 'UTILIZATION_WITHOUT_USAGE', metric: 'utilization' });
  if (summary.verifiedSavings > 0 && !summary.hasVerifiedFinancialEvidence) issues.push({ rule: 'SAVINGS_WITHOUT_FINANCIAL_EVIDENCE', metric: 'verifiedSavings' });
  return issues;
}