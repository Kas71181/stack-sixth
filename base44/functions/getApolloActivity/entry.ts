import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { authorizeTargetUser } from '../../shared/authorizeTargetUser.ts';
import { ingestConnectorMembership } from '../../shared/evidenceIngestion.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const access = await authorizeTargetUser(base44, body);
    if (access.error) return access.error;
    const user = access.user;

    const stored = await base44.asServiceRole.entities.ApiCredential.filter({ service: 'apollo', owner_user_id: user.id });
    const legacy = stored.length ? [] : await base44.asServiceRole.entities.ApiCredential.filter({ service: 'apollo', created_by_id: user.id });
    const credential = stored[0] || legacy[0] || null;
    let apiKey = credential?.api_key || null;
    const isOAuth = credential?.extra_fields?.auth_type === 'oauth';
    if (!apiKey) return Response.json({ success: false, not_configured: true, error: 'Apollo is not connected' }, { status: 200 });

    if (isOAuth && credential.extra_fields?.refresh_token && new Date(credential.extra_fields.expires_at || 0).getTime() <= Date.now() + 60000) {
      const refreshRes = await fetch('https://app.apollo.io/api/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credential.extra_fields.refresh_token,
          client_id: secrets.get('APOLLO_OAUTH_CLIENT_ID'),
          client_secret: secrets.get('APOLLO_OAUTH_CLIENT_SECRET'),
        }),
      });
      const refreshed = await refreshRes.json();
      if (!refreshRes.ok || !refreshed.access_token) return Response.json({ success: false, error: 'Apollo sign-in expired. Please reconnect Apollo.' }, { status: 200 });
      apiKey = refreshed.access_token;
      await base44.asServiceRole.entities.ApiCredential.update(credential.id, {
        api_key: apiKey,
        extra_fields: {
          ...credential.extra_fields,
          refresh_token: refreshed.refresh_token || credential.extra_fields.refresh_token,
          expires_at: new Date(Date.now() + (refreshed.expires_in || 2592000) * 1000).toISOString(),
        },
      });
    }

    if (isOAuth) {
      const headers = { Authorization: `Bearer ${apiKey}`, accept: 'application/json', 'Content-Type': 'application/json' };
      const [profileRes, apiUsageRes] = await Promise.all([
        fetch('https://api.apollo.io/api/v1/users/api_profile?include_credit_usage=true', { headers }),
        fetch('https://api.apollo.io/api/v1/usage_stats/api_usage_stats', { method: 'POST', headers }),
      ]);
      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}));
        return Response.json({ success: false, error: `Apollo API error (${profileRes.status}): ${err.message || err.error || 'Reconnect Apollo'}` }, { status: 200 });
      }
      const profile = await profileRes.json();
      const apiUsage = apiUsageRes.ok ? await apiUsageRes.json() : {};
      const creditFields = ['num_lead_credits_used', 'num_direct_dial_credits_used', 'num_export_credits_used', 'num_ai_credits_used', 'num_power_up_credits_used'];
      const creditsByType = Object.fromEntries(creditFields.map((field) => [field, Number(profile[field] || 0)]));
      const totalCreditsUsed = Number(profile.total_unified_credits_used || Object.values(creditsByType).reduce((sum, value) => sum + value, 0));
      const dailyApiCalls = Object.values(apiUsage).reduce((sum, endpoint) => sum + Number(endpoint?.day?.consumed || 0), 0);
      const observedUsage = totalCreditsUsed > 0 || dailyApiCalls > 0;
      const evidenceStatus = dailyApiCalls > 0 ? 'VERIFIED_LIVE' : observedUsage ? 'OBSERVED' : 'INSUFFICIENT_EVIDENCE';
      const now = new Date().toISOString();
      const membership = await ingestConnectorMembership(base44, user, { appName: 'Apollo.io', connectorType: 'apollo', workspaceId: profile.team_id || null, organizationVerified: true, capabilities: ['profile', 'credit_usage', ...(apiUsageRes.ok ? ['api_usage'] : [])], seatAssignments: false, members: [{ id: profile.id, email: profile.email, name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email }], limitations: apiUsageRes.ok ? ['Credit and API usage are workspace signals, not complete Apollo UI activity'] : ['Credit consumption is verified; reconnect after enabling api_usage_stats_read for API activity'] });
      const apps = membership.organizationAppId ? [{ id: membership.organizationAppId }] : [];
      const connections = await base44.entities.IntegrationConnection.filter({ organization_id: user.id, connector_type: 'apollo' });
      const evidenceData = { organization_id: user.id, organization_app_id: apps[0]?.id, evidence_category: 'USAGE', evidence_status: evidenceStatus, source_type: 'apollo_credit_usage', source_connection_id: connections[0]?.id, source_record_id: profile.id, observed_at: now, valid_from: now, freshness_status: 'fresh', verification_method: 'Apollo OAuth credit and API usage endpoints', derived_metadata: { credits_by_type: creditsByType, total_credits_used: totalCreditsUsed, api_calls_today: dailyApiCalls, api_usage_scope_granted: apiUsageRes.ok } };
      const usageEvidence = apps[0] ? await base44.entities.EvidenceRecord.filter({ organization_id: user.id, organization_app_id: apps[0].id, source_type: 'apollo_credit_usage' }) : [];
      if (usageEvidence[0]) await base44.entities.EvidenceRecord.update(usageEvidence[0].id, evidenceData);
      else if (apps[0]) await base44.entities.EvidenceRecord.create(evidenceData);
      if (apps[0]) await base44.entities.OrganizationApp.update(apps[0].id, { usage_status: evidenceStatus, last_validated_at: now });
      if (connections[0]) await base44.entities.IntegrationConnection.update(connections[0].id, { usage_supported: observedUsage, usage_events_created: dailyApiCalls, provider_data_current_through: now, last_successful_sync_at: now });
      const activity = { tool_name: 'Apollo.io', user_email: profile.email, user_name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email, last_active_date: dailyApiCalls > 0 ? now.slice(0, 10) : undefined, days_active_last_30: dailyApiCalls > 0 ? 1 : 0, activity_score: dailyApiCalls > 0 ? 90 : totalCreditsUsed > 0 ? 50 : 0, status: dailyApiCalls > 0 ? 'Active' : totalCreditsUsed > 0 ? 'Dormant' : 'Inactive', wasted_cost_flag: false, source: 'live', logins_last_30: 0, features_used: Object.values(creditsByType).filter((value) => value > 0).length, transactions_last_30: 0, content_created_last_30: 0, api_calls_last_30: dailyApiCalls };
      const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Apollo.io', user_email: profile.email, created_by_id: user.id });
      if (existing[0]) await base44.asServiceRole.entities.UserActivity.update(existing[0].id, activity);
      else await base44.asServiceRole.entities.UserActivity.create({ ...activity, created_by_id: user.id });
      return Response.json({ success: true, total: 1, evidence_status: evidenceStatus, usage_status: evidenceStatus, credits_used: totalCreditsUsed, api_calls_today: dailyApiCalls, api_usage_scope_granted: apiUsageRes.ok, requires_reconnect: !apiUsageRes.ok, evidence_note: membership.limitations.join('; ') });
    }

    const usersRes = await fetch(isOAuth
      ? 'https://api.apollo.io/api/v1/users/search?page=1&per_page=200'
      : 'https://api.apollo.io/api/v1/users/search', {
      method: isOAuth ? 'GET' : 'POST',
      headers: isOAuth
        ? { 'Authorization': `Bearer ${apiKey}`, 'accept': 'application/json' }
        : { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'accept': 'application/json' },
      body: isOAuth ? undefined : JSON.stringify({ api_key: apiKey, page: 1, per_page: 200 }),
    });

    if (!usersRes.ok) {
      const err = await usersRes.json().catch(() => ({}));
      return Response.json({ success: false, error: `Apollo API error (${usersRes.status}): ${err.message || err.error || (isOAuth ? 'Reconnect Apollo and approve team member access' : 'Check the stored key and its team member access')}` }, { status: 200 });
    }

    const data = await usersRes.json();
    const allMembers = data.users || [];

    // Auto-detect team domain: use user's email domain, or auto-detect from workspace members
    const userDomain = (user.email || '').split('@')[1]?.toLowerCase();
    const freeProviders = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'];
    let teamDomain = (userDomain && !freeProviders.includes(userDomain)) ? userDomain : null;
    if (!teamDomain) {
      const domainCounts = {};
      for (const m of allMembers) {
        const email = m.email?.toLowerCase();
        if (!email) continue;
        const domain = email.split('@')[1];
        if (domain && !freeProviders.includes(domain)) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
      const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) teamDomain = sorted[0][0];
    }
    const members = teamDomain
      ? allMembers.filter((m) => m.email?.toLowerCase().endsWith('@' + teamDomain))
      : allMembers;

    const now = new Date();
    const activityRecords = members.map((m) => {
      const lastActive = m.last_activity_date ? new Date(m.last_activity_date) : null;
      const daysSince = lastActive ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)) : 999;
      const activityScore = daysSince <= 7 ? 90 : daysSince <= 14 ? 70 : daysSince <= 30 ? 40 : 10;
      const status = activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Dormant' : 'Inactive';

      return {
        tool_name: 'Apollo.io',
        user_email: m.email,
        user_name: m.name || m.email,
        last_active_date: lastActive ? lastActive.toISOString().split('T')[0] : null,
        days_active_last_30: Math.max(0, 30 - daysSince),
        activity_score: activityScore,
        status,
        wasted_cost_flag: activityScore < 40,
        source: 'live',
        logins_last_30: daysSince <= 30 ? 1 : 0,
        features_used: 0,
        transactions_last_30: 0,
        content_created_last_30: 0,
        api_calls_last_30: 0,
      };
    });

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'Apollo.io', created_by_id: user.id });
    const existingByEmail = new Map(existing.map((r) => [r.user_email, r.id]));

    let created = 0, updated = 0, deleted = 0;
    const syncedEmails = new Set(activityRecords.map((r) => r.user_email));
    for (const record of activityRecords) {
      if (existingByEmail.has(record.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(record.user_email), record);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create({ ...record, created_by_id: user.id });
        created++;
      }
    }
    // Clean up records for members no longer in the filtered team
    for (const old of existing) {
      if (!syncedEmails.has(old.user_email)) {
        await base44.asServiceRole.entities.UserActivity.delete(old.id);
        deleted++;
      }
    }

    return Response.json({ success: true, total: activityRecords.length, created, updated, deleted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}