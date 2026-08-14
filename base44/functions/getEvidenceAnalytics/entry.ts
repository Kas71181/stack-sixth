import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { classifySeat, calculateApplicationMetrics, calculateCoverage, validateMetrics } from '../../shared/evidenceEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const now = new Date();
    const [apps, seats, financialRecords, evidenceRecords, recommendations] = await Promise.all([
      base44.entities.OrganizationApp.filter({ created_by_id: user.id }),
      base44.entities.ApplicationSeat.filter({ created_by_id: user.id }),
      base44.entities.FinancialRecord.filter({ created_by_id: user.id }),
      base44.entities.EvidenceRecord.filter({ created_by_id: user.id }),
      base44.entities.Recommendation.filter({ created_by_id: user.id })
    ]);

    const seatUpdates = [];
    const normalizedSeats = seats.map((seat) => {
      const app = apps.find((item) => item.id === seat.organization_app_id);
      const classification = classifySeat(seat, { thresholdDays: app?.dormancy_threshold_days || 60, seasonal: false }, now);
      if (classification !== seat.usage_classification) seatUpdates.push({ id: seat.id, usage_classification: classification });
      return { ...seat, usage_classification: classification };
    });
    if (seatUpdates.length) await base44.asServiceRole.entities.ApplicationSeat.bulkUpdate(seatUpdates);

    const applicationMetrics = apps.map((app) => ({
      app,
      metrics: calculateApplicationMetrics(app, normalizedSeats.filter((seat) => seat.organization_app_id === app.id), financialRecords)
    }));
    const summary = {
      totalApplications: apps.length,
      assignedSeats: applicationMetrics.reduce((sum, item) => sum + item.metrics.assignedSeats, 0),
      activeSeats: applicationMetrics.reduce((sum, item) => sum + item.metrics.activeSeats, 0),
      dormantSeats: applicationMetrics.reduce((sum, item) => sum + item.metrics.dormantSeats, 0),
      dormantApplications: applicationMetrics.filter((item) => item.metrics.dormantApplication).length,
      verifiedSavings: applicationMetrics.filter((item) => item.metrics.savings.classification === 'SAVINGS_READY_TO_CAPTURE').reduce((sum, item) => sum + (item.metrics.savings.amount || 0), 0),
      renewalOpportunity: applicationMetrics.filter((item) => item.metrics.savings.classification === 'RENEWAL_SAVINGS_OPPORTUNITY').reduce((sum, item) => sum + (item.metrics.savings.amount || 0), 0),
      optimizationCandidates: applicationMetrics.filter((item) => item.metrics.savings.classification === 'OPTIMIZATION_CANDIDATE').length,
      usageCoverage: apps.length ? Math.round(applicationMetrics.reduce((sum, item) => sum + item.metrics.usageCoverage, 0) / apps.length) : 0,
      utilization: null,
      hasVerifiedFinancialEvidence: apps.some((app) => app.financial_status === 'FINANCIAL_EVIDENCE')
    };
    const fullyCovered = applicationMetrics.filter((item) => item.metrics.utilization !== null);
    summary.utilization = fullyCovered.length ? Math.round(fullyCovered.reduce((sum, item) => sum + item.metrics.utilization, 0) / fullyCovered.length) : null;
    const validationIssues = validateMetrics(summary);
    if (validationIssues.length) {
      summary.verifiedSavings = 0;
      summary.utilization = null;
      await base44.asServiceRole.entities.ValidationIssue.bulkCreate(validationIssues.map((issue) => ({ organization_id: user.id, rule_code: issue.rule, severity: 'critical', message: `Suppressed invalid ${issue.metric}`, metric_name: issue.metric, resolved: false, created_by_id: user.id })));
    }

    const recommendationCreates = [];
    const openKeys = new Set(recommendations.filter((item) => item.status === 'Open').map((item) => `${item.organization_app_id}:${item.recommendation_type}`));
    for (const item of applicationMetrics) {
      const savings = item.metrics.savings;
      const type = savings.classification === 'SAVINGS_READY_TO_CAPTURE' ? 'seat_reclamation' : savings.classification === 'RENEWAL_SAVINGS_OPPORTUNITY' ? 'renewal_optimization' : item.metrics.usageCoverage < 100 ? 'usage_verification' : null;
      if (!type || openKeys.has(`${item.app.id}:${type}`)) continue;
      const evidenceIds = evidenceRecords.filter((record) => record.organization_app_id === item.app.id).map((record) => record.id);
      recommendationCreates.push({ company_id: user.id, organization_app_id: item.app.id, recommendation_type: type, recommended_action: type === 'seat_reclamation' ? `Review ${savings.reclaimableSeats} verified reclaimable seat(s)` : type === 'renewal_optimization' ? 'Review seat commitment at renewal' : 'Connect a supported usage source', category: type === 'seat_reclamation' ? 'Reclaim Seats' : type === 'renewal_optimization' ? 'Negotiate Contract' : 'Downgrade Plan', tool_name: item.app.display_name, description: type === 'usage_verification' ? 'Usage evidence is insufficient for a precise utilization or savings claim.' : `${savings.reclaimableSeats} seat(s) meet the deterministic evidence requirements.`, financial_impact: savings.amount ?? undefined, financial_impact_status: savings.classification, evidence_sources: evidenceIds, evidence_level: type === 'usage_verification' ? 'INSUFFICIENT_EVIDENCE' : 'VERIFIED_LIVE', confidence_level: type === 'usage_verification' ? 'insufficient' : 'high', calculation_method: savings.method, last_validated_at: now.toISOString(), validation_status: validationIssues.length ? 'suppressed' : 'valid', priority: type === 'seat_reclamation' ? 'High' : 'Medium', status: 'Open', created_by_id: user.id });
    }
    if (recommendationCreates.length) await base44.entities.Recommendation.bulkCreate(recommendationCreates);

    return Response.json({
      summary,
      coverage: calculateCoverage(apps),
      applications: applicationMetrics.map((item) => ({ id: item.app.id, canonicalAppId: item.app.canonical_app_id, name: item.app.display_name, statuses: { ownership: item.app.ownership_status, access: item.app.access_status, usage: item.app.usage_status, financial: item.app.financial_status, contract: item.app.contract_status }, ...item.metrics })),
      validation: { passed: validationIssues.length === 0, issues: validationIssues },
      recommendationsCreated: recommendationCreates.length,
      calculatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('Evidence analytics failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}