import { resolveCanonicalApp } from './canonicalApps.ts';

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
  const organizationApp = await upsertOne(tenant.OrganizationApp, {
    organization_id: user.id,
    canonical_app_id: canonical.canonical_app_id,
  }, {
    organization_id: user.id,
    canonical_app_id: canonical.canonical_app_id,
    display_name: canonical.name,
    category: canonical.category,
    lifecycle_status: 'active',
    ownership_status: input.organizationVerified ? 'VERIFIED_LIVE' : 'OBSERVED',
    access_status: input.members.length ? 'OBSERVED' : 'INSUFFICIENT_EVIDENCE',
    usage_status: 'INSUFFICIENT_EVIDENCE',
    connected: true,
    organization_verified: input.organizationVerified,
    dormancy_threshold_days: canonical.default_dormancy_days,
    last_validated_at: now,
    created_by_id: user.id,
  });
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
    organization_verified: input.organizationVerified,
    capabilities_enabled: input.capabilities,
    last_successful_sync_at: now,
    provider_data_through: now,
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
    const organizationUser = existingUsers[0] || await tenant.OrganizationUser.create({ organization_id: user.id, primary_email: member.email || undefined, normalized_email: normalized, display_name: member.name, employee_status: 'unknown', identity_provider_id: member.id, last_identity_sync_at: now });
    if (!existingUsers[0]) usersCreated += 1;
    else await tenant.OrganizationUser.update(organizationUser.id, { display_name: member.name, identity_provider_id: member.id, last_identity_sync_at: now });
    if (!input.seatAssignments) continue;
    const shadowSeats = await service.ApplicationSeat.filter({ organization_id: user.id, organization_app_id: organizationApp.id, provider_seat_id: member.id });
    for (const record of shadowSeats.filter((item) => item.created_by_id !== user.id)) await service.ApplicationSeat.delete(record.id);
    const existingSeats = await tenant.ApplicationSeat.filter({ organization_id: user.id, organization_app_id: organizationApp.id, provider_seat_id: member.id });
    const seatData = { organization_id: user.id, organization_app_id: organizationApp.id, organization_user_id: organizationUser.id, provider_seat_id: member.id, seat_status: 'assigned', assignment_verified_at: now, activity_event_count: 0, activity_window_days: 0, activity_source: `${input.connectorType}_membership`, usage_evidence_level: 'INSUFFICIENT_EVIDENCE', data_freshness: 'fresh', usage_classification: 'INSUFFICIENT_EVIDENCE' };
    if (existingSeats[0]) await tenant.ApplicationSeat.update(existingSeats[0].id, seatData);
    else { await tenant.ApplicationSeat.create(seatData); seatsCreated += 1; }
  }
  await upsertOne(tenant.EvidenceRecord, { organization_id: user.id, organization_app_id: organizationApp.id, source_type: `${input.connectorType}_membership`, source_record_id: input.workspaceId || connection.id }, { organization_id: user.id, organization_app_id: organizationApp.id, evidence_category: 'ACCESS', evidence_status: 'OBSERVED', source_type: `${input.connectorType}_membership`, source_connection_id: connection.id, source_record_id: input.workspaceId || connection.id, observed_at: now, valid_from: now, freshness_status: 'fresh', verification_method: 'provider membership endpoint', derived_metadata: { member_count: input.members.length, limitations: input.limitations } });
  return { app: organizationApp.display_name, members: input.members.length, usersCreated, seatsCreated, evidenceStatus: 'OBSERVED', limitations: input.limitations };
}