import { resolveCanonicalApp } from './canonicalApps.ts';

export const FRESHNESS_POLICIES = {
  google_workspace_admin: { expectedHours: 4, staleHours: 12 },
  microsoft_entra: { expectedHours: 4, staleHours: 12 },
  okta: { expectedHours: 4, staleHours: 12 },
  slack: { expectedHours: 12, staleHours: 24 },
  github: { expectedHours: 12, staleHours: 24 },
  notion: { expectedHours: 24, staleHours: 48 },
};

export const QUALIFYING_ACTIVITY = {
  slack: new Set(['message', 'call', 'file_shared', 'search']),
  github: new Set(['push', 'pull_request', 'pull_request_review', 'issues', 'issue_comment', 'repository_access', 'repo_admin']),
  google_workspace_admin: new Set(['login', 'service_access', 'application_access']),
  microsoft_entra: new Set(['successful_sign_in']),
  okta: new Set(['successful_app_authentication', 'app_access']),
};

export function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildProviderEventId(event) {
  if (event.providerEventId) return String(event.providerEventId);
  return `generated:${stableHash([event.organizationId, event.provider, event.application, event.providerUserId, event.occurredAt, event.eventType].join('|'))}`;
}

export function freshnessStatus(connectorType, syncedAt, now = new Date()) {
  if (!syncedAt) return 'unknown';
  const ageHours = (now.getTime() - new Date(syncedAt).getTime()) / 3600000;
  const policy = FRESHNESS_POLICIES[connectorType] || { expectedHours: 12, staleHours: 24 };
  if (ageHours <= policy.expectedHours) return 'fresh';
  if (ageHours <= policy.staleHours) return 'delayed';
  return 'stale';
}

export function isQualifyingActivity(provider, eventType, identityType = 'human', succeeded = true) {
  if (!succeeded || ['bot', 'service_account', 'integration'].includes(identityType)) return false;
  return QUALIFYING_ACTIVITY[provider]?.has(eventType) === true;
}

export function verifyUsageClaim(input, now = new Date()) {
  return input.usageSupported === true && input.hasMappedEvent === true && input.organizationMatched === true && input.userMatched === true && input.applicationMatched === true && input.syncStatus === 'succeeded' && freshnessStatus(input.provider, input.providerDataCurrentThrough, now) === 'fresh';
}

export async function ingestUsageEvents(base44, user, input) {
  const now = new Date();
  const canonical = resolveCanonicalApp(input.application);
  const apps = await base44.entities.OrganizationApp.filter({ organization_id: user.id, canonical_app_id: canonical.canonical_app_id });
  if (!apps[0]) throw new Error(`Canonical application ${canonical.canonical_app_id} is not in this organization`);
  const connectionRows = await base44.entities.IntegrationConnection.filter({ organization_id: user.id, connector_type: input.provider });
  if (!connectionRows[0]) throw new Error(`Connector ${input.provider} is not registered for this organization`);
  let created = 0;
  for (const event of input.events) {
    const providerEventId = buildProviderEventId({ ...event, organizationId: user.id, provider: input.provider, application: canonical.canonical_app_id });
    const duplicate = await base44.entities.UsageEvent.filter({ organization_id: user.id, provider: input.provider, provider_event_id: providerEventId });
    if (duplicate[0]) continue;
    const identities = await base44.entities.ProviderIdentity.filter({ organization_id: user.id, provider: input.provider, provider_user_id: String(event.providerUserId) });
    let identity = identities[0];
    if (!identity && event.email) {
      const normalizedEmail = event.email.toLowerCase().trim();
      const users = await base44.entities.OrganizationUser.filter({ organization_id: user.id, normalized_email: normalizedEmail });
      if (users[0]) identity = await base44.entities.ProviderIdentity.create({ organization_id: user.id, provider: input.provider, provider_user_id: String(event.providerUserId), canonical_user_id: users[0].canonical_user_id || users[0].id, verified_email: normalizedEmail, identity_type: users[0].identity_type || 'human', resolution_method: 'verified_email', manually_resolved: false });
    }
    const qualifies = isQualifyingActivity(input.provider, event.eventType, identity?.identity_type, event.succeeded !== false);
    const verified = verifyUsageClaim({ usageSupported: true, hasMappedEvent: qualifies, organizationMatched: true, userMatched: !!identity?.canonical_user_id, applicationMatched: true, syncStatus: input.syncStatus, provider: input.provider, providerDataCurrentThrough: input.providerDataCurrentThrough }, now);
    const usageEvent = await base44.entities.UsageEvent.create({ organization_id: user.id, organization_app_id: apps[0].id, canonical_app_id: canonical.canonical_app_id, organization_user_id: identity?.canonical_user_id, canonical_user_id: identity?.canonical_user_id, provider: input.provider, provider_user_id: String(event.providerUserId), provider_app_identifier: event.providerAppIdentifier || input.application, provider_event_id: providerEventId, event_type: event.eventType, occurred_at: event.occurredAt, ingested_at: now.toISOString(), source_connection_id: connectionRows[0].id, qualifies_as_activity: qualifies, evidence_level: verified ? 'VERIFIED_LIVE' : qualifies ? 'OBSERVED' : 'INSUFFICIENT_EVIDENCE', provider_metadata: event.metadata || {} });
    if (verified) {
      const evidence = await base44.entities.EvidenceRecord.create({ organization_id: user.id, organization_app_id: apps[0].id, evidence_category: 'USAGE', evidence_status: 'VERIFIED_LIVE', source_type: `${input.provider}_activity`, source_connection_id: connectionRows[0].id, source_record_id: usageEvent.id, observed_at: event.occurredAt, valid_from: event.occurredAt, valid_through: input.providerDataCurrentThrough, freshness_status: 'fresh', verification_method: 'provider-supported qualifying activity event', derived_metadata: { provider_event_id: providerEventId, event_type: event.eventType } });
      const seats = await base44.entities.ApplicationSeat.filter({ organization_id: user.id, organization_app_id: apps[0].id, organization_user_id: identity.canonical_user_id });
      const current = seats[0];
      const count = (current?.usage_event_count || 0) + 1;
      const firstActivity = !current?.first_activity_at || new Date(event.occurredAt) < new Date(current.first_activity_at) ? event.occurredAt : current.first_activity_at;
      const lastActivity = !current?.last_activity_at || new Date(event.occurredAt) > new Date(current.last_activity_at) ? event.occurredAt : current.last_activity_at;
      const seatData = { organization_id: user.id, organization_app_id: apps[0].id, canonical_app_id: canonical.canonical_app_id, organization_user_id: identity.canonical_user_id, user_id: identity.canonical_user_id, provider_user_id: String(event.providerUserId), provider_seat_id: String(event.providerUserId), seat_status: current?.seat_status || 'assigned', assignment_verified_at: current?.assignment_verified_at || now.toISOString(), usage_supported: true, usage_verified: true, activity_source: input.provider, first_activity_at: firstActivity, last_activity_at: lastActivity, last_verified_activity_at: lastActivity, usage_event_count: count, activity_event_count: count, observation_window_days: input.observationWindowDays || 0, activity_window_days: input.observationWindowDays || 0, last_successful_sync_at: now.toISOString(), provider_data_current_through: input.providerDataCurrentThrough, sync_status: 'succeeded', evidence_level: 'VERIFIED_LIVE', evidence_record_ids: [...(current?.evidence_record_ids || []), evidence.id], data_freshness_status: 'fresh', data_freshness: 'fresh', confidence_level: 'high', usage_evidence_level: 'VERIFIED_LIVE' };
      if (current) await base44.entities.ApplicationSeat.update(current.id, seatData);
      else await base44.entities.ApplicationSeat.create(seatData);
    }
    created += 1;
  }
  await base44.entities.IntegrationConnection.update(connectionRows[0].id, { usage_supported: true, last_successful_sync_at: now.toISOString(), provider_data_current_through: input.providerDataCurrentThrough, usage_events_created: created, records_processed: input.events.length, connection_status: 'connected', authentication_status: 'valid', rate_limit_status: 'ok', health_status: freshnessStatus(input.provider, input.providerDataCurrentThrough, now) });
  return { created, duplicates: input.events.length - created, canonicalAppId: canonical.canonical_app_id };
}