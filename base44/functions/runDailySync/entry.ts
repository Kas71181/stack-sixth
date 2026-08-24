import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { requireAdmin } from '../../shared/requireAdmin.ts';

// Scheduled function — re-syncs all API-key-based tools for every user daily.
// OAuth tools (Slack, GitHub, Notion) require user presence and are skipped.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Only authenticated administrators may trigger system-wide synchronization.
    const access = await requireAdmin(base44);
    if (access.error) return access.error;

    const SYNC_FUNCTIONS = [
      'getZoomActivity',
      'getApolloActivity',
      'getHubSpotActivity',
      'getSalesforceActivity',
      'getQuickBooksActivity',
      'getBambooHRHeadcount',
    ];

    // Get all users who have stored API credentials (i.e. have connected at least one tool)
    const allCreds = await base44.asServiceRole.entities.ApiCredential.list('-created_date', 500);
    const userIds = [...new Set(allCreds.map((c) => c.created_by_id).filter(Boolean))];

    if (userIds.length === 0) {
      return Response.json({ success: true, message: 'No users with connected tools', synced: 0 });
    }

    const results = [];
    for (const userId of userIds) {
      const subscriptions = await base44.asServiceRole.entities.OrganizationSubscription.filter({ owner_user_id: userId });
      if (subscriptions[0]?.workspace_mode === 'READ_ONLY') continue;
      let syncedTools = 0;
      let totalUsers = 0;

      for (const fnName of SYNC_FUNCTIONS) {
        try {
          const res = await base44.asServiceRole.functions.invoke(fnName, { _targetUserId: userId });
          if (res?.data?.success) {
            syncedTools++;
            totalUsers += res.data.total || 0;
          }
        } catch {
          // Credential not configured or sync failed — skip silently
        }
      }

      // Run HRIS reconciliation if BambooHR data exists for this user
      if (syncedTools > 0) {
        try {
          await base44.asServiceRole.functions.invoke('reconcileHRIS', { _targetUserId: userId });
        } catch {}
      }

      if (syncedTools > 0) {
        results.push({ userId, syncedTools, totalUsers });
      }
    }

    return Response.json({
      success: true,
      usersProcessed: results.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}