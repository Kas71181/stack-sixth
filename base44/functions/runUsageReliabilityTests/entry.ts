import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildProviderEventId, verifyUsageClaim } from '../../shared/usageReliability.ts';
import { classifySeat, validateMetrics } from '../../shared/evidenceEngine.ts';
import { requireAdmin } from '../../shared/requireAdmin.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const access = await requireAdmin(base44);
    if (access.error) return access.error;
    const now = new Date('2026-08-17T12:00:00Z');
    const live = { usageSupported: true, hasMappedEvent: true, organizationMatched: true, userMatched: true, applicationMatched: true, syncStatus: 'succeeded', provider: 'microsoft_entra', providerDataCurrentThrough: now.toISOString() };
    const event = { organizationId: 'org-1', provider: 'microsoft_entra', application: 'slack', providerUserId: 'user-1', occurredAt: now.toISOString(), eventType: 'successful_sign_in' };
    const tests = [
      ['Slack membership stays access-only', !verifyUsageClaim({ ...live, provider: 'slack', hasMappedEvent: false }, now)],
      ['Complete Slack telemetry permits dormancy', classifySeat({ seat_status: 'assigned', assignment_verified_at: now.toISOString(), usage_supported: true, usage_verified: true, sync_status: 'succeeded', data_freshness_status: 'fresh', observation_window_days: 60 }, { thresholdDays: 30 }, now) === 'STRONG_DORMANCY_CANDIDATE'],
      ['Notion membership cannot verify usage', !verifyUsageClaim({ ...live, provider: 'notion', usageSupported: false }, now)],
      ['Identity-provider activity can verify usage', verifyUsageClaim(live, now)],
      ['Generated event IDs are stable', buildProviderEventId(event) === buildProviderEventId(event)],
      ['Stale data removes live status', !verifyUsageClaim({ ...live, providerDataCurrentThrough: '2026-08-15T00:00:00Z' }, now)],
      ['Bogus dormant count is rejected', validateMetrics({ dormantApplications: 59, totalApplications: 8, activeSeats: 0, dormantSeats: 0, unknownSeats: 0, assignedSeats: 0, usageCoverage: 0, utilization: null, verifiedSavings: 0, hasVerifiedFinancialEvidence: false }).some((issue) => issue.rule === 'DORMANT_APPS_EXCEED_TOTAL')],
    ];
    return Response.json({ passed: tests.every(([, passed]) => passed), tests: tests.map(([name, passed]) => ({ name, passed })) });
  } catch (error) {
    console.error('Usage reliability tests failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}