import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stored = await base44.entities.ApiCredential.filter({ service: 'quickbooks' });
    const cred = stored[0];
    const accessToken = cred?.api_key || null;
    const realmId = cred?.extra_fields?.realm_id || null;

    if (!accessToken || !realmId) {
      return Response.json({ success: false, not_configured: true, error: 'QuickBooks credentials not configured' }, { status: 200 });
    }

    // Fetch users (employees) from QuickBooks
    const queryRes = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from Employee MAXRESULTS 200&minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/text',
        }
      }
    );

    if (!queryRes.ok) {
      const err = await queryRes.json().catch(() => ({}));
      return Response.json({ success: false, error: `QuickBooks API error (${queryRes.status}): ${err?.Fault?.Error?.[0]?.Message || 'Check your credentials'}` }, { status: 200 });
    }

    const data = await queryRes.json();
    const employees = data?.QueryResponse?.Employee || [];

    const now = new Date();
    const activityRecords = employees.map((emp) => {
      const lastUpdated = emp.MetaData?.LastUpdatedTime ? new Date(emp.MetaData.LastUpdatedTime) : null;
      const daysSince = lastUpdated ? Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24)) : 999;
      const activityScore = emp.Active ? (daysSince <= 30 ? 75 : 50) : 10;
      const status = activityScore >= 70 ? 'Active' : activityScore >= 40 ? 'Dormant' : 'Inactive';
      const email = emp.PrimaryEmailAddr?.Address || `${emp.Id}@quickbooks.local`;

      return {
        tool_name: 'QuickBooks',
        user_email: email,
        user_name: emp.DisplayName || `${emp.GivenName || ''} ${emp.FamilyName || ''}`.trim() || email,
        last_active_date: lastUpdated ? lastUpdated.toISOString().split('T')[0] : null,
        days_active_last_30: Math.max(0, 30 - daysSince),
        activity_score: activityScore,
        status,
        wasted_cost_flag: !emp.Active || activityScore < 40,
        source: 'live',
      };
    });

    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'QuickBooks' });
    const existingByEmail = new Map(existing.map((r) => [r.user_email, r.id]));

    let created = 0, updated = 0;
    for (const record of activityRecords) {
      if (existingByEmail.has(record.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(record.user_email), record);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create(record);
        created++;
      }
    }

    return Response.json({ success: true, total: activityRecords.length, created, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});