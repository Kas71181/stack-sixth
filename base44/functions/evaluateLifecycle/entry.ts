import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';
import { resolveCanonicalApp } from '../../shared/canonicalApps.ts';
import { calculateApplicationMetrics } from '../../shared/evidenceEngine.ts';
import { autoRenewalStatus, daysBetweenDateOnly, deduplicateContracts, isVerifiedRenewal, subtractNoticeDays, todayDateOnly } from '../../shared/governanceReliability.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me(); if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user); if (!context) return Response.json({ alerts: [], summary: { total_alerts: 0, dormant_count: 0, renewal_count: 0, critical_count: 0, total_wasted: null, total_at_risk: null } });
    const service = base44.asServiceRole.entities; const ownerId = context.company.owner_user_id || context.company.created_by_id; const organizationIds = [...new Set([context.companyId, ownerId].filter(Boolean))];
    const [appsByCompany, appsByOwner, integrations, contractsByCompany, legacyContracts, seatsByCompany, seatsByOwner, financialByCompany, financialByOwner] = await Promise.all([
      service.OrganizationApp.filter({ organization_id: context.companyId }), service.OrganizationApp.filter({ organization_id: ownerId }), service.SaasIntegration.filter({ company_id: context.companyId }), service.Contract.filter({ company_id: context.companyId }), service.Contract.filter({ created_by_id: ownerId }), service.ApplicationSeat.filter({ organization_id: context.companyId }), service.ApplicationSeat.filter({ organization_id: ownerId }), service.FinancialRecord.filter({ organization_id: context.companyId }), service.FinancialRecord.filter({ organization_id: ownerId })
    ]);
    const apps = [...new Map([...appsByCompany, ...appsByOwner].map((item) => [item.id, item])).values()]; const seats = [...new Map([...seatsByCompany, ...seatsByOwner].map((item) => [item.id, item])).values()]; const financial = [...new Map([...financialByCompany, ...financialByOwner].map((item) => [item.id, item])).values()]; const alerts = [];
    for (const app of apps) {
      const appSeats = seats.filter((item) => item.organization_app_id === app.id); const appFinancial = financial.filter((item) => item.organization_app_id === app.id); const metrics = calculateApplicationMetrics(app, appSeats, appFinancial);
      if (!metrics.dormantApplication) continue;
      const integration = integrations.find((item) => resolveCanonicalApp(item.tool_name).canonical_app_id === app.canonical_app_id);
      if (!integration) continue;
      alerts.push({ type: 'dormant', severity: metrics.dormantSeats === metrics.assignedSeats ? 'high' : 'medium', tool_name: app.display_name, active_users: metrics.activeSeats, inactive_users: metrics.dormantSeats, inactive_pct: metrics.assignedSeats ? Math.round(metrics.dormantSeats / metrics.assignedSeats * 100) : null, avg_activity_score: null, wasted_cost: metrics.savings.amount, monthly_cost: metrics.cost.monthlyAmount, licensed_seats: metrics.assignedSeats, recommended_action: 'review', integration_id: integration.id, evidence: metrics.evidence, usage_evidence_status: 'verified', classification: 'DORMANT_APPLICATION' });
    }
    const contracts = deduplicateContracts([...contractsByCompany, ...legacyContracts]); const today = todayDateOnly();
    for (const contract of contracts) {
      if (!isVerifiedRenewal(contract) || ['Cancelled', 'Expired'].includes(contract.status)) continue;
      const days = daysBetweenDateOnly(today, contract.renewal_date); if (days === null || days > 90 || days < -30) continue;
      const deadline = contract.notice_deadline || subtractNoticeDays(contract.renewal_date, contract.notice_period_days); const deadlineDays = deadline ? daysBetweenDateOnly(today, deadline) : null; const autoStatus = autoRenewalStatus(contract);
      let action = 'review', severity = days <= 30 ? 'high' : 'low'; if (deadlineDays !== null && deadlineDays <= 14 && deadlineDays >= 0) { action = 'urgent_review'; severity = 'critical'; }
      alerts.push({ type: 'renewal', severity, tool_name: contract.vendor_name, renewal_date: contract.renewal_date, notice_deadline: deadline, decision_deadline: contract.decision_deadline || deadline, days_until_renewal: days, days_until_deadline: deadlineDays, monthly_cost: contract.monthly_cost ?? null, annual_cost: contract.annual_cost ?? null, auto_renewal_status: autoStatus, auto_renews: autoStatus === 'yes', notice_period_days: contract.notice_period_days ?? null, avg_activity_score: null, recommended_action: action, contract_id: contract.id, seats_licensed: contract.seats_licensed ?? null, evidence: { source: contract.renewal_source_label || contract.renewal_source, sourceRecordId: contract.renewal_source_record_id, verifiedAt: contract.last_verified_at, verificationStatus: contract.verification_status } });
    }
    const order = { critical: 0, high: 1, medium: 2, low: 3 }; alerts.sort((a,b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4)); const pricedDormancy = alerts.filter((item) => item.type === 'dormant' && item.wasted_cost != null);
    return Response.json({ alerts, summary: { total_alerts: alerts.length, dormant_count: alerts.filter((item) => item.type === 'dormant').length, renewal_count: alerts.filter((item) => item.type === 'renewal').length, critical_count: alerts.filter((item) => item.severity === 'critical').length, total_wasted: pricedDormancy.length ? pricedDormancy.reduce((sum,item) => sum + item.wasted_cost,0) : null, total_at_risk: null, company_name: context.company.name, evidence_scope: organizationIds } });
  } catch (error) { console.error('Lifecycle evaluation failed', error); return Response.json({ error: error.message }, { status: 500 }); }
}