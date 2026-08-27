import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { classifySeat, calculateApplicationMetrics, calculateCoverage, validateMetrics } from '../../shared/evidenceEngine.ts';
import { normalizeCanonicalAppId } from '../../shared/canonicalApps.ts';

function usageStatus(app, metrics) {
  if (metrics.activeSeats + metrics.dormantSeats > 0) return 'VERIFIED_LIVE';
  if (app.usage_status === 'OBSERVED') return 'OBSERVED';
  if (metrics.verifiedAccessOnlySeats > 0 || app.access_status === 'VERIFIED_ACCESS') return 'VERIFIED_ACCESS';
  return 'INSUFFICIENT_EVIDENCE';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const now = new Date();
    const [apps, seats, financialRecords, evidenceRecords, recommendations, acquisitionEvents, learningModels] = await Promise.all([
      base44.entities.OrganizationApp.filter({ organization_id: user.id }),
      base44.entities.ApplicationSeat.filter({ organization_id: user.id }),
      base44.entities.FinancialRecord.filter({ organization_id: user.id }),
      base44.entities.EvidenceRecord.filter({ organization_id: user.id }),
      base44.entities.Recommendation.filter({ created_by_id: user.id }),
      base44.entities.AcquisitionEvent.filter({ organization_id: user.id }),
      base44.entities.ContinuousLearningModel.filter({ status: 'active' }, '-version', 1)
    ]);
    const usagePolicy = learningModels[0]?.usage_policy || { dormancy_threshold_days: 60, low_activity_fraction: 0.5, minimum_observation_days: 60 };

    const seatUpdates = [];
    const normalizedSeats = seats.map((seat) => {
      const app = apps.find((item) => item.id === seat.organization_app_id);
      const classification = classifySeat(seat, { thresholdDays: app?.dormancy_threshold_days || usagePolicy.dormancy_threshold_days, lowActivityFraction: usagePolicy.low_activity_fraction, minimumObservationDays: usagePolicy.minimum_observation_days, seasonal: false }, now);
      if (classification !== seat.usage_classification) seatUpdates.push({ id: seat.id, usage_classification: classification });
      return { ...seat, usage_classification: classification };
    });
    if (seatUpdates.length) await base44.asServiceRole.entities.ApplicationSeat.bulkUpdate(seatUpdates);

    const appGroups = new Map();
    for (const app of apps) {
      const key = normalizeCanonicalAppId(app.canonical_app_id || app.id);
      if (!appGroups.has(key)) appGroups.set(key, []);
      appGroups.get(key).push(app);
    }
    const applicationMetrics = [...appGroups.values()].map((group) => {
      const app = group[0];
      const ids = new Set(group.map((item) => item.id));
      const metrics = calculateApplicationMetrics(app, normalizedSeats.filter((seat) => ids.has(seat.organization_app_id)), financialRecords.filter((record) => ids.has(record.organization_app_id)));
      return { app, duplicateIds: group.slice(1).map((item) => item.id), metrics, usageStatus: usageStatus(app, metrics) };
    });

    const summary = {
      totalApplications: applicationMetrics.length,
      assignedSeats: applicationMetrics.reduce((sum, item) => sum + item.metrics.assignedSeats, 0),
      activeSeats: applicationMetrics.reduce((sum, item) => sum + item.metrics.activeSeats, 0),
      dormantSeats: applicationMetrics.reduce((sum, item) => sum + item.metrics.dormantSeats, 0),
      unknownSeats: applicationMetrics.reduce((sum, item) => sum + item.metrics.unknownSeats, 0),
      dormantApplications: applicationMetrics.filter((item) => item.metrics.dormantApplication).length,
      verifiedUsageApplications: applicationMetrics.filter((item) => item.usageStatus === 'VERIFIED_LIVE').length,
      partialEvidenceApplications: applicationMetrics.filter((item) => ['VERIFIED_ACCESS', 'OBSERVED'].includes(item.usageStatus)).length,
      insufficientEvidenceApplications: applicationMetrics.filter((item) => item.usageStatus === 'INSUFFICIENT_EVIDENCE').length,
      verifiedSavings: applicationMetrics.filter((item) => item.metrics.savings.classification === 'SAVINGS_READY_TO_CAPTURE').reduce((sum, item) => sum + (item.metrics.savings.amount || 0), 0),
      renewalOpportunity: applicationMetrics.filter((item) => item.metrics.savings.classification === 'RENEWAL_SAVINGS_OPPORTUNITY').reduce((sum, item) => sum + (item.metrics.savings.amount || 0), 0),
      optimizationCandidates: applicationMetrics.filter((item) => item.metrics.savings.classification === 'OPTIMIZATION_CANDIDATE').length,
      usageCoverage: applicationMetrics.length ? Math.round(applicationMetrics.reduce((sum, item) => sum + item.metrics.usageCoverage, 0) / applicationMetrics.length) : 0,
      utilization: null,
      currentMonthlySpend: applicationMetrics.reduce((sum, item) => sum + (item.metrics.cost.status === 'confirmed' ? item.metrics.cost.monthlyAmount || 0 : 0), 0),
      costsVerified: applicationMetrics.filter((item) => item.metrics.cost.status === 'confirmed').length,
      costsNeedReview: applicationMetrics.filter((item) => item.metrics.cost.status === 'needs_review').length,
      duplicateApplications: applicationMetrics.reduce((sum, item) => sum + item.duplicateIds.length, 0),
      hasVerifiedFinancialEvidence: applicationMetrics.some((item) => item.metrics.cost.status === 'confirmed')
    };
    const fullyCovered = applicationMetrics.filter((item) => item.metrics.utilization !== null);
    summary.utilization = fullyCovered.length ? Math.round(fullyCovered.reduce((sum, item) => sum + item.metrics.utilization, 0) / fullyCovered.length) : null;

    const validationIssues = validateMetrics(summary);
    for (const item of applicationMetrics) {
      if (item.duplicateIds.length) validationIssues.push({ rule: 'DUPLICATE_APPLICATION', metric: 'totalApplications', organizationAppId: item.app.id });
      if (item.metrics.cost.status === 'needs_review') validationIssues.push({ rule: 'COST_SOURCE_CONFLICT', metric: 'currentMonthlySpend', organizationAppId: item.app.id });
    }
    summary.suppressedMetrics = [...new Set(validationIssues.map((issue) => issue.metric))];
    for (const metric of summary.suppressedMetrics) {
      if (['utilization', 'verifiedSavings', 'usageCoverage'].includes(metric)) summary[metric] = null;
    }

    if (validationIssues.length) {
      const openIssues = await base44.asServiceRole.entities.ValidationIssue.filter({ organization_id: user.id, resolved: false });
      const existing = new Set(openIssues.map((issue) => `${issue.rule_code}:${issue.organization_app_id || ''}`));
      const creates = validationIssues.filter((issue) => !existing.has(`${issue.rule}:${issue.organizationAppId || ''}`)).map((issue) => ({ organization_id: user.id, organization_app_id: issue.organizationAppId, rule_code: issue.rule, severity: issue.rule === 'COST_SOURCE_CONFLICT' ? 'error' : 'critical', message: `Suppressed invalid ${issue.metric}`, metric_name: issue.metric, resolved: false, created_by_id: user.id }));
      if (creates.length) await base44.asServiceRole.entities.ValidationIssue.bulkCreate(creates);
    }

    const recommendationCreates = [];
    const openKeys = new Set(recommendations.filter((item) => item.status === 'Open').map((item) => `${item.organization_app_id}:${item.recommendation_type}`));
    for (const item of applicationMetrics) {
      const savings = item.metrics.savings;
      const type = savings.classification === 'SAVINGS_READY_TO_CAPTURE' ? 'seat_reclamation' : savings.classification === 'RENEWAL_SAVINGS_OPPORTUNITY' ? 'renewal_optimization' : item.metrics.usageCoverage < 100 ? 'usage_verification' : null;
      if (!type || openKeys.has(`${item.app.id}:${type}`)) continue;
      const evidenceIds = evidenceRecords.filter((record) => record.organization_app_id === item.app.id).map((record) => record.id);
      recommendationCreates.push({ company_id: user.id, organization_app_id: item.app.id, recommendation_type: type, recommended_action: type === 'seat_reclamation' ? `Review ${savings.reclaimableSeats} verified reclaimable seat(s)` : type === 'renewal_optimization' ? 'Review seat commitment at renewal' : 'Connect a supported usage source', category: type === 'seat_reclamation' ? 'Reclaim Seats' : type === 'renewal_optimization' ? 'Negotiate Contract' : 'Downgrade Plan', tool_name: item.app.display_name, description: type === 'usage_verification' ? 'Usage evidence is insufficient for a precise utilization or savings claim.' : `${savings.reclaimableSeats} seat(s) meet the deterministic evidence requirements.`, financial_impact: savings.amount ?? undefined, financial_impact_status: savings.classification, evidence_sources: evidenceIds, evidence_level: type === 'usage_verification' ? item.usageStatus : 'VERIFIED_LIVE', confidence_level: type === 'usage_verification' ? 'insufficient' : 'high', calculation_method: savings.method, last_validated_at: now.toISOString(), validation_status: validationIssues.some((issue) => issue.organizationAppId === item.app.id) ? 'suppressed' : 'valid', priority: type === 'seat_reclamation' ? 'High' : 'Medium', status: 'Open', created_by_id: user.id });
    }
    if (recommendationCreates.length) await base44.entities.Recommendation.bulkCreate(recommendationCreates);

    const milestoneNames = new Set(acquisitionEvents.map((event) => event.event_name));
    const milestones = [
      ['account_created', true, user.created_date],
      ['first_software_discovered', applicationMetrics.length > 0],
      ['first_cost_verified', summary.costsVerified > 0],
      ['first_usage_evidence_received', summary.verifiedUsageApplications > 0],
      ['first_recommendation_generated', recommendations.length + recommendationCreates.length > 0],
      ['first_trusted_insight', summary.verifiedSavings > 0]
    ];
    for (const [eventName, reached, occurredAt] of milestones) {
      if (reached && !milestoneNames.has(eventName)) await base44.asServiceRole.entities.AcquisitionEvent.create({ organization_id: user.id, owner_user_id: user.id, event_name: eventName, properties: {}, occurred_at: occurredAt || now.toISOString(), created_by_id: user.id });
    }
    const trustedEvent = acquisitionEvents.find((event) => event.event_name === 'first_trusted_insight');
    const timeToFirstTrustedInsightMinutes = trustedEvent && user.created_date ? Math.max(0, Math.round((new Date(trustedEvent.occurred_at) - new Date(user.created_date)) / 60000)) : null;

    const applications = applicationMetrics.map((item) => ({ id: item.app.id, canonicalAppId: item.app.canonical_app_id, name: item.app.display_name, duplicateIds: item.duplicateIds, statuses: { ownership: item.app.ownership_status, access: item.app.access_status, usage: item.usageStatus, financial: item.metrics.cost.status === 'confirmed' ? 'FINANCIAL_EVIDENCE' : item.metrics.cost.status === 'needs_review' ? 'NEEDS_REVIEW' : 'INSUFFICIENT_EVIDENCE', contract: item.app.contract_status }, ...item.metrics }));
    return Response.json({
      summary,
      coverage: calculateCoverage(applications.map((item) => ({ ownership_status: item.statuses.ownership, access_status: item.statuses.access, usage_status: item.statuses.usage, financial_status: item.statuses.financial, contract_status: item.statuses.contract }))),
      applications,
      validation: { passed: validationIssues.length === 0, issues: validationIssues },
      productQuality: { timeToFirstTrustedInsightMinutes },
      recommendationsCreated: recommendationCreates.length,
      calculatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('Evidence analytics failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}