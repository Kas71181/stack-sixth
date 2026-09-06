import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { classifySeat, calculateApplicationMetrics, deduplicateFinancialRecords, normalizeBilling, reconcileCurrentCost, validateMetrics } from '../../shared/evidenceEngine.ts';
import { assertTenantRecord, hardenAnalysisResult, recommendationFreshness, validateDecisionInput } from '../../shared/recommendationReliability.ts';
import { requireAdmin } from '../../shared/requireAdmin.ts';

export default async function(req) {
  let testAudit;
  try {
    const base44 = createClientFromRequest(req); const access = await requireAdmin(base44); if (access.error) return access.error;
    const user = access.user; const now = new Date('2026-08-17T12:00:00Z');
    const finance = { id: 'f1', organization_app_id: 'a1', amount: 1200, marginal_unit_price: 120, currency: 'USD', billing_period: 'annual', status: 'confirmed', authoritative: true, verified_at: now.toISOString(), valid_through: '2027-08-17T12:00:00Z', seat_reduction_changes_spend: true };
    const dormantSeat = (id) => ({ id, organization_user_id: id, provider_seat_id: id, seat_status: 'assigned', assignment_verified_at: now.toISOString(), usage_supported: true, usage_verified: true, sync_status: 'succeeded', data_freshness_status: 'fresh', observation_window_days: 90, last_activity_at: '2026-05-01T00:00:00Z', usage_event_count: 2, usage_classification: 'DORMANCY_CANDIDATE' });
    const appMetrics = calculateApplicationMetrics({ id: 'a1', display_name: 'Test' }, [dormantSeat('s1'), dormantSeat('s2')], [finance]);
    const missingCost = calculateApplicationMetrics({ id: 'a1', display_name: 'Test' }, [dormantSeat('s1')], []);
    const hardened = hardenAnalysisResult({ recommendations: [{ name: 'Candidate', match_score: 92, estimated_monthly_cost: 50, estimated_savings_opportunity: 100, migration_risk: 'low' }] }, { id: 'audit', existing_software: [], business_processes: [], pain_points: [] }, now.toISOString());
    const conflict = reconcileCurrentCost([finance, { ...finance, id: 'f2', authoritative: false, amount: 2400, source_name: 'invoice-2' }], now);
    const tests = [
      ['Annual billing normalizes monthly', normalizeBilling(finance).monthlyAmount === 100 && normalizeBilling(finance).annualAmount === 1200],
      ['One-time expense is not annualized', normalizeBilling({ amount: 500, billing_period: 'one-time' }).monthlyAmount === null],
      ['Seat savings uses normalized marginal price', appMetrics.savings.amount === 20 && appMetrics.savings.annualAmount === 240],
      ['Application cancellation is not inferred', appMetrics.savings.method.includes('seat') && !appMetrics.savings.method.includes('cancellation')],
      ['Duplicate invoices are removed', deduplicateFinancialRecords([finance, { ...finance, id: 'copy' }]).length === 1],
      ['Duplicate seats are removed', calculateApplicationMetrics({ id: 'a1', display_name: 'Test' }, [dormantSeat('s1'), dormantSeat('s1')], [finance]).assignedSeats === 1],
      ['Overlapping opportunity counted once', appMetrics.savings.amount === appMetrics.savings.reclaimableSeats * 10],
      ['Missing cost suppresses savings', missingCost.savings.amount === null],
      ['Conflicting costs require review', conflict.status === 'needs_review'],
      ['Stale usage is insufficient', classifySeat({ ...dormantSeat('x'), data_freshness_status: 'stale' }, { thresholdDays: 60 }, now) === 'INSUFFICIENT_EVIDENCE'],
      ['Failed connector is insufficient', classifySeat({ ...dormantSeat('x'), sync_status: 'failed' }, { thresholdDays: 60 }, now) === 'INSUFFICIENT_EVIDENCE'],
      ['Zero records do not prove dormancy', classifySeat({ ...dormantSeat('x'), usage_verified: false, last_activity_at: null }, { thresholdDays: 60 }, now) === 'INSUFFICIENT_EVIDENCE'],
      ['Unsupported AI match score is suppressed', hardened.recommendations[0].match_score === null],
      ['Unsupported AI savings and ROI are suppressed', hardened.recommendations[0].estimated_savings_opportunity === null && hardened.recommendations[0].estimated_monthly_cost === null],
      ['Tenant mismatch is rejected', (() => { try { assertTenantRecord({ created_by_id: 'other' }, user.id); return false; } catch { return true; } })()],
      ['Legacy recommendation requires revalidation', recommendationFreshness(null, []).status === 'requires_revalidation'],
      ['Decision values are deterministic', validateDecisionInput('deferred', { deferOption: 'next_audit' }) === true],
      ['Invalid seat totals are rejected', validateMetrics({ dormantApplications: 0, totalApplications: 1, activeSeats: 2, dormantSeats: 1, unknownSeats: 0, assignedSeats: 2, reclaimableSeats: 0, usageCoverage: 100, utilization: 50, verifiedSavings: 0, verifiedAnnualSavings: 0, hasVerifiedFinancialEvidence: true }).some((issue) => issue.rule === 'SEAT_COUNTS_EXCEED_ASSIGNED')]
    ];
    testAudit = await base44.entities.SoftwareAudit.create({ company_name: 'Reliability test', user_type: 'optimize', team_size: 1, status: 'completed', analysis_result: { recommendations: [{ name: 'Test', decision_state: null }] } });
    await base44.entities.SoftwareAudit.update(testAudit.id, { analysis_result: { recommendations: [{ name: 'Test', decision_state: 'approved', decision_at: now.toISOString(), savings_state: 'not_realized' }] } });
    const persisted = await base44.entities.SoftwareAudit.get(testAudit.id);
    tests.push(['Approve persists without realizing savings', persisted.analysis_result.recommendations[0].decision_state === 'approved' && persisted.analysis_result.recommendations[0].savings_state === 'not_realized']);
    await base44.entities.SoftwareAudit.delete(testAudit.id); testAudit = null;
    return Response.json({ passed: tests.every(([, passed]) => passed), tests: tests.map(([name, passed]) => ({ name, passed })) });
  } catch (error) {
    if (testAudit) try { const base44 = createClientFromRequest(req); await base44.entities.SoftwareAudit.delete(testAudit.id); } catch {}
    console.error('Usage reliability tests failed', error); return Response.json({ error: error.message }, { status: 500 });
  }
}