import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { CANONICAL_APPS, resolveCanonicalApp } from '../../shared/canonicalApps.ts';
import { CONNECTOR_CAPABILITIES } from '../../shared/connectorCapabilities.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const organizationId = user.id;
    const now = new Date().toISOString();

    const [integrations, activities, contracts, existingApps, existingUsers, existingSeats, existingCatalog, existingEvidence, existingFinancial, existingConnections] = await Promise.all([
      base44.entities.SaasIntegration.filter({ created_by_id: user.id }),
      base44.entities.UserActivity.filter({ created_by_id: user.id }),
      base44.entities.Contract.filter({ created_by_id: user.id }),
      base44.entities.OrganizationApp.filter({ created_by_id: user.id }),
      base44.entities.OrganizationUser.filter({ created_by_id: user.id }),
      base44.entities.ApplicationSeat.filter({ created_by_id: user.id }),
      base44.entities.CanonicalApp.list(),
      base44.entities.EvidenceRecord.filter({ created_by_id: user.id }),
      base44.entities.FinancialRecord.filter({ created_by_id: user.id }),
      base44.entities.IntegrationConnection.filter({ created_by_id: user.id })
    ]);

    const catalogIds = new Set(existingCatalog.map((item) => item.canonical_app_id));
    const catalogToCreate = CANONICAL_APPS.filter((item) => !catalogIds.has(item.canonical_app_id));
    if (catalogToCreate.length && user.role === 'admin') await base44.asServiceRole.entities.CanonicalApp.bulkCreate(catalogToCreate.map((item) => ({ ...item, created_by_id: user.id })));

    const sources = new Map();
    const addSource = (name, type, record) => {
      if (!name) return;
      const canonical = resolveCanonicalApp(name);
      if (!sources.has(canonical.canonical_app_id)) sources.set(canonical.canonical_app_id, { canonical, integrations: [], activities: [], contracts: [] });
      sources.get(canonical.canonical_app_id)[type].push(record);
    };
    integrations.forEach((record) => addSource(record.tool_name, 'integrations', record));
    activities.forEach((record) => addSource(record.tool_name, 'activities', record));
    contracts.forEach((record) => addSource(record.vendor_name, 'contracts', record));

    const appByCanonical = new Map(existingApps.map((app) => [app.canonical_app_id, app]));
    const appCreates = [];
    const appUpdates = [];
    for (const [canonicalId, group] of sources) {
      const contractEvidence = group.contracts.some((item) => item.file_url || item.renewal_source === 'contract');
      const financialEvidence = group.contracts.some((item) => (item.monthly_cost || item.annual_cost) > 0);
      const accessVerified = ['slack', 'github'].includes(canonicalId) && group.activities.length > 0;
      const payload = {
        organization_id: organizationId,
        canonical_app_id: canonicalId,
        display_name: group.canonical.name,
        category: group.canonical.category || group.integrations[0]?.category || 'Other',
        lifecycle_status: group.contracts.some((item) => item.status === 'Cancelled') ? 'cancelled' : 'active',
        ownership_status: contractEvidence || financialEvidence ? 'VERIFIED_LIVE' : group.integrations.length ? 'OBSERVED' : 'DISCOVERED',
        access_status: accessVerified ? 'VERIFIED_ACCESS' : group.activities.length ? 'OBSERVED' : 'INSUFFICIENT_EVIDENCE',
        usage_status: 'INSUFFICIENT_EVIDENCE',
        financial_status: financialEvidence ? 'FINANCIAL_EVIDENCE' : 'INSUFFICIENT_EVIDENCE',
        contract_status: contractEvidence ? 'CONTRACT_EVIDENCE' : 'INSUFFICIENT_EVIDENCE',
        connected: group.integrations.some((item) => item.connection_status === 'Connected'),
        organization_verified: accessVerified,
        dormancy_threshold_days: group.canonical.default_dormancy_days,
        last_validated_at: now
      };
      const existing = appByCanonical.get(canonicalId);
      if (existing) appUpdates.push({ id: existing.id, ...payload });
      else appCreates.push({ ...payload, created_by_id: user.id });
    }
    if (appUpdates.length) await base44.asServiceRole.entities.OrganizationApp.bulkUpdate(appUpdates);
    const createdApps = appCreates.length ? await base44.entities.OrganizationApp.bulkCreate(appCreates) : [];
    [...existingApps, ...createdApps].forEach((app) => appByCanonical.set(app.canonical_app_id, app));

    const connectionTypes = new Set(existingConnections.map((item) => item.connector_type));
    const connectionCreates = integrations.flatMap((item) => {
      const connectorType = resolveCanonicalApp(item.tool_name).canonical_app_id;
      if (connectionTypes.has(connectorType)) return [];
      connectionTypes.add(connectorType);
      const manifest = CONNECTOR_CAPABILITIES[connectorType] || {};
      return [{
        organization_id: organizationId,
        connector_type: connectorType,
        connected: item.connection_status === 'Connected',
        organization_verified: ['slack', 'github'].includes(connectorType),
        capabilities_enabled: Object.entries(manifest).filter(([, enabled]) => enabled).map(([capability]) => capability),
        last_successful_sync_at: item.last_synced ? `${item.last_synced}T00:00:00.000Z` : undefined,
        provider_data_through: item.evidence_checked_at || undefined,
        health_status: item.connection_status === 'Connected' ? 'healthy' : item.connection_status === 'Failed' ? 'failed' : 'unknown',
        created_by_id: user.id
      }];
    });
    if (connectionCreates.length) await base44.entities.IntegrationConnection.bulkCreate(connectionCreates);

    const validActivities = activities.filter((item) => item.user_email && !item.user_email.includes('placeholder'));
    const userByEmail = new Map(existingUsers.map((item) => [item.normalized_email, item]));
    const userCreates = [];
    for (const activity of validActivities) {
      const email = activity.user_email.toLowerCase().trim();
      if (!userByEmail.has(email)) {
        userByEmail.set(email, { normalized_email: email });
        userCreates.push({ organization_id: organizationId, primary_email: email.includes('@') ? email : undefined, normalized_email: email, display_name: activity.user_name || email, employee_status: activity.offboarded_flag ? 'offboarded' : 'unknown', created_by_id: user.id });
      }
    }
    const createdUsers = userCreates.length ? await base44.entities.OrganizationUser.bulkCreate(userCreates) : [];
    createdUsers.forEach((item) => userByEmail.set(item.normalized_email, item));

    const seatKeys = new Set(existingSeats.map((seat) => `${seat.organization_app_id}:${seat.provider_seat_id}`));
    const seatCreates = [];
    for (const activity of validActivities) {
      const canonical = resolveCanonicalApp(activity.tool_name);
      const app = appByCanonical.get(canonical.canonical_app_id);
      const normalizedEmail = activity.user_email.toLowerCase().trim();
      const key = `${app?.id}:${normalizedEmail}`;
      if (!app || seatKeys.has(key)) continue;
      seatKeys.add(key);
      const verifiedAccess = ['slack', 'github'].includes(canonical.canonical_app_id);
      seatCreates.push({ organization_id: organizationId, organization_app_id: app.id, organization_user_id: userByEmail.get(normalizedEmail)?.id, provider_seat_id: normalizedEmail, seat_status: verifiedAccess ? 'assigned' : 'unknown', assignment_verified_at: verifiedAccess ? activity.updated_date || now : undefined, last_verified_activity_at: undefined, activity_event_count: 0, activity_window_days: 0, activity_source: `legacy_${canonical.canonical_app_id}`, usage_evidence_level: activity.source === 'live' ? 'OBSERVED' : 'INSUFFICIENT_EVIDENCE', data_freshness: 'unknown', usage_classification: 'INSUFFICIENT_EVIDENCE', created_by_id: user.id });
    }
    if (seatCreates.length) await base44.entities.ApplicationSeat.bulkCreate(seatCreates);

    const financialCreates = [];
    const evidenceCreates = [];
    const evidenceKeys = new Set(existingEvidence.map((item) => `${item.evidence_category}:${item.source_type}:${item.source_record_id || item.organization_app_id}`));
    const financialKeys = new Set(existingFinancial.map((item) => `${item.organization_app_id}:${item.evidence_id || ''}`));
    const addEvidence = (record) => {
      const key = `${record.evidence_category}:${record.source_type}:${record.source_record_id || record.organization_app_id}`;
      if (!evidenceKeys.has(key)) { evidenceKeys.add(key); evidenceCreates.push(record); }
    };
    for (const [canonicalId, group] of sources) {
      const app = appByCanonical.get(canonicalId);
      if (!app) continue;
      group.integrations.forEach((item) => addEvidence({ organization_id: organizationId, organization_app_id: app.id, evidence_category: 'OWNERSHIP', evidence_status: item.evidence_type === 'financial' ? 'OBSERVED' : 'DISCOVERED', source_type: 'legacy_integration', source_record_id: item.id, observed_at: item.evidence_checked_at || item.updated_date || now, freshness_status: 'unknown', verification_method: 'legacy migration', created_by_id: user.id }));
      group.contracts.forEach((item) => {
        addEvidence({ organization_id: organizationId, organization_app_id: app.id, evidence_category: 'CONTRACT', evidence_status: item.file_url || item.renewal_source === 'contract' ? 'CONTRACT_EVIDENCE' : 'OBSERVED', source_type: 'contract', source_record_id: item.id, observed_at: item.updated_date || now, freshness_status: 'fresh', verification_method: item.renewal_source || 'manual', created_by_id: user.id });
        const amount = item.monthly_cost || (item.annual_cost ? item.annual_cost / 12 : 0);
        const key = `${app.id}:${item.id}`;
        if (amount > 0 && !financialKeys.has(key)) {
          financialKeys.add(key);
          financialCreates.push({ organization_id: organizationId, organization_app_id: app.id, record_type: 'contract', amount, currency: 'USD', billing_period: 'monthly', quantity: item.seats_licensed || undefined, minimum_commitment: item.seats_licensed || undefined, seat_reduction_changes_spend: false, evidence_id: item.id, verified_at: item.updated_date || now, valid_through: item.renewal_date ? `${item.renewal_date}T23:59:59.000Z` : now, created_by_id: user.id });
        }
      });
      if (group.activities.length) addEvidence({ organization_id: organizationId, organization_app_id: app.id, evidence_category: 'USAGE', evidence_status: 'OBSERVED', source_type: 'legacy_activity', observed_at: now, freshness_status: 'unknown', verification_method: 'legacy connector output; not promoted to verified usage', derived_metadata: { records: group.activities.length }, created_by_id: user.id });
    }
    if (financialCreates.length) await base44.entities.FinancialRecord.bulkCreate(financialCreates);
    if (evidenceCreates.length) await base44.entities.EvidenceRecord.bulkCreate(evidenceCreates);

    return Response.json({ success: true, applications: sources.size, organizationAppsCreated: appCreates.length, usersCreated: userCreates.length, seatsCreated: seatCreates.length, connectionsCreated: connectionCreates.length, evidenceCreated: evidenceCreates.length, financialRecordsCreated: financialCreates.length });
  } catch (error) {
    console.error('Evidence foundation initialization failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}