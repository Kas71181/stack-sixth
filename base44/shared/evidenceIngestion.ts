import { normalizeCanonicalAppId, resolveCanonicalApp } from './canonicalApps.ts';

async function upsertOne(entity, filter, data) {
  const existing = await entity.filter(filter);
  if (existing[0]) {
    await entity.update(existing[0].id, data);
    return { ...existing[0], ...data };
  }
  return await entity.create(data);
}

export async function ingestConnectorMembership(base44, user, input) {
  const now = new Date().toISOString();
  const canonical = resolveCanonicalApp(input.appName);
  const service = base44.asServiceRole.entities;
  const tenant = base44.entities;
  await upsertOne(service.CanonicalApp, { canonical_app_id: canonical.canonical_app_id }, canonical);
  const appData = {
    organization_id: user.id,
    canonical_app_id: canonical.canonical_app_id,
    display_name: canonical.name,
    category: canonical.category,
    lifecycle_status: 'active',
    ownership_status: input.organizationVerified ? 'VERIFIED_LIVE' : 'OBSERVED',
    access_status: input.members.length ? 'VERIFIED_ACCESS' : 'INSUFFICIENT_EVIDENCE',
    usage_status: 'INSUFFICIENT_EVIDENCE',
    connected: true,
    organization_verified: input.organizationVerified,
    dormancy_threshold_days: canonical.default_dormancy_days,
    last_validated_at: now,
    created_by_id: user.id,
  };
  const organizationApps = await tenant.OrganizationApp.filter({ organization_id: user.id });
  const existingApp = organizationApps.find((item) => item.canonical_app_id === canonical.canonical_app_id)
    || organizationApps.find((item) => normalizeCanonicalAppId(item.canonical_app_id) === canonical.canonical_app_id);
  const organizationApp = existingApp ? { ...existingApp, ...appData } : await tenant.OrganizationApp.create(appData);
  if (existingApp) await tenant.OrganizationApp.update(existingApp.id, appData);
  const shadowConnections = await service.IntegrationConnection.filter({ organization_id: user.id, connector_type: input.connectorType });
  for (const record of shadowConnections.filter((item) => item.created_by_id !== user.id)) await service.IntegrationConnection.delete(record.id);
  const shadowEvidence = await service.EvidenceRecord.filter({ organization_id: user.id, organization_app_id: organizationApp.id, source_type: `${input.connectorType}_membership` });
  for (const record of shadowEvidence.filter((item) => item.created_by_id !== user.id)) await service.EvidenceRecord.delete(record.id);
  const connection = await upsertOne(tenant.IntegrationConnection, {
    organization_id: user.id,
    connector_type: input.connectorType,
  }, {
    organization_id: user.id,
    connector_type: input.connectorType,
    provider_workspace_id: input.workspaceId || undefined,
    connected: true,
    connection_status: 'connected',
    authentication_status: 'valid',
    organization_verified: input.organizationVerified,
    capabilities_enabled: input.capabilities,
    usage_supported: false,
    last_sync_started_at: now,
    last_successful_sync_at: now,
    provider_data_through: now,
    provider_data_current_through: now,
    records_processed: input.members.length,
    records_created: 0,
    records_updated: 0,
    usage_events_created: 0,
    rate_limit_status: 'ok',
    health_status: 'healthy',
    created_by_id: user.id,
  });
  let usersCreated = 0;
  let seatsCreated = 0;
  for (const member of input.members) {
    const normalized = (member.email || `${input.connectorType}:${member.id}`).toLowerCase();
    const shadowUsers = await service.OrganizationUser.filter({ organization_id: user.id, identity_provider_id: member.id });
    for (const record of shadowUsers.filter((item) => item.created_by_id !== user.id)) await service.OrganizationUser.delete(record.id);
    const existingUsers = await tenant.OrganizationUser.filter({ organization_id: user.id, normalized_email: normalized });
    const organizationUser = existingUsers[0] || await tenant.OrganizationUser.create({ organization_id: user.id, primary_email: member.email || undefined, normalized_email: normalized, display_name: member.name, employee_status: 'unknown', identity_type: member.isBot ? 'bot' : 'human', identity_provider_id: member.id, last_identity_sync_at: now });
    if (!existingUsers[0]) {
      usersCreated += 1;
      organizationUser.canonical_user_id = organizationUser.id;
      await tenant.OrganizationUser.update(organizationUser.id, { canonical_user_id: organizationUser.id });
    } else await tenant.OrganizationUser.update(organizationUser.id, { display_name: member.name, identity_provider_id: member.id, last_identity_sync_at: now });
    await upsertOne(tenant.ProviderIdentity, { organization_id: user.id, provider: input.connectorType, provider_user_id: String(member.id) }, { organization_id: user.id, provider: input.connectorType, provider_user_id: String(member.id), canonical_user_id: organizationUser.canonical_user_id || organizationUser.id, verified_email: member.email || undefined, identity_type: member.isBot ? 'bot' : 'human', resolution_method: member.email ? 'verified_email' : 'unresolved', manually_resolved: false });
    if (!input.seatAssignments) continue;
    const shadowSeats = await service.ApplicationSeat.filter({ organization_id: user.id, organization_app_id: organizationApp.id, provider_seat_id: member.id });
    for (const record of shadowSeats.filter((item) => item.created_by_id !== user.id)) await service.ApplicationSeat.delete(record.id);
    const existingSeats = await tenant.ApplicationSeat.filter({ organization_id: user.id, organization_app_id: organizationApp.id, provider_seat_id: member.id });
    const seatData = { organization_id: user.id, organization_app_id: organizationApp.id, canonical_app_id: canonical.canonical_app_id, organization_user_id: organizationUser.id, user_id: organizationUser.canonical_user_id || organizationUser.id, provider_user_id: String(member.id), provider_seat_id: String(member.id), seat_status: 'assigned', assignment_verified_at: now, usage_supported: false, usage_verified: false, activity_source: `${input.connectorType}_membership`, usage_event_count: 0, activity_event_count: 0, observation_window_days: 0, activity_window_days: 0, last_successful_sync_at: now, provider_data_current_through: now, sync_status: 'succeeded', evidence_level: 'VERIFIED_ACCESS', evidence_record_ids: [], data_freshness_status: 'fresh', data_freshness: 'fresh', confidence_level: 'high', usage_evidence_level: 'VERIFIED_ACCESS', usage_classification: 'INSUFFICIENT_EVIDENCE' };
    if (existingSeats[0]) await tenant.ApplicationSeat.update(existingSeats[0].id, seatData);
    else { await tenant.ApplicationSeat.create(seatData); seatsCreated += 1; }
  }
  const accessEvidence = await upsertOne(tenant.EvidenceRecord, { organization_id: user.id, organization_app_id: organizationApp.id, source_type: `${input.connectorType}_membership`, source_record_id: input.workspaceId || connection.id }, { organization_id: user.id, organization_app_id: organizationApp.id, evidence_category: 'ACCESS', evidence_status: 'VERIFIED_ACCESS', source_type: `${input.connectorType}_membership`, source_connection_id: connection.id, source_record_id: input.workspaceId || connection.id, observed_at: now, valid_from: now, freshness_status: 'fresh', verification_method: 'provider membership endpoint', derived_metadata: { member_count: input.members.length, usage_supported: false, limitations: input.limitations } });
  await tenant.IntegrationConnection.update(connection.id, { records_created: usersCreated + seatsCreated, records_updated: Math.max(0, input.members.length - usersCreated), records_processed: input.members.length });
  return { app: organizationApp.display_name, organizationAppId: organizationApp.id, members: input.members.length, usersCreated, seatsCreated, evidenceRecordId: accessEvidence.id, evidenceStatus: 'VERIFIED_ACCESS', usageStatus: 'INSUFFICIENT_EVIDENCE', limitations: input.limitations };
}