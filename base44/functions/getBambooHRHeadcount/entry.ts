import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { authorizeTargetUser } from '../../shared/authorizeTargetUser.ts';

// Pulls full employee list from BambooHR for true headcount-based seat analysis.
// BambooHR uses HTTP Basic Auth: API key as username, 'x' as password.
// Subdomain is the company's BambooHR subdomain (e.g. "acme" for acme.bamboohr.com).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const access = await authorizeTargetUser(base44, body);
    if (access.error) return access.error;
    const user = access.user;

    // Load stored credentials
    const stored = await base44.asServiceRole.entities.ApiCredential.filter({ service: 'bamboohr', created_by_id: user.id });
    if (!stored[0]?.api_key || !stored[0]?.extra_fields?.subdomain) {
      return Response.json({ success: false, not_configured: true, error: 'BambooHR credentials not configured' });
    }

    const apiKey = stored[0].api_key;
    const subdomain = stored[0].extra_fields.subdomain;
    const basicAuth = btoa(`${apiKey}:x`);
    const headers = {
      Authorization: `Basic ${basicAuth}`,
      Accept: 'application/json',
    };

    // Fetch employee directory
    const dirRes = await fetch(
      `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/employees/directory`,
      { headers }
    );

    if (!dirRes.ok) {
      const hint = dirRes.status === 403
        ? 'Invalid API key or subdomain. Generate a key in BambooHR → Account Settings → API Keys.'
        : dirRes.status === 404
        ? 'Subdomain not found. Check your BambooHR subdomain (e.g. for acme.bamboohr.com enter "acme").'
        : `BambooHR API error (${dirRes.status})`;
      return Response.json({ success: false, error: hint });
    }

    const dirData = await dirRes.json();
    const employees = dirData.employees || [];

    // Fetch employment status for each employee (batch via fields API)
    const fieldsRes = await fetch(
      `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/reports/custom?format=JSON`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Stack Sixth Headcount',
          fields: ['firstName', 'lastName', 'workEmail', 'department', 'jobTitle', 'employmentHistoryStatus', 'hireDate', 'terminationDate'],
          filters: { lastChanged: { includeNull: true, value: '2000-01-01' } },
        }),
      }
    );

    const fieldData = fieldsRes.ok ? await fieldsRes.json() : { employees: [] };
    const enrichedByEmail = new Map(
      (fieldData.employees || []).map((e) => [e.workEmail, e])
    );

    const now = new Date();
    const activityRecords = employees
      .filter((e) => e.workEmail) // skip employees without email
      .map((e) => {
        const enriched = enrichedByEmail.get(e.workEmail) || {};
        const isActive = (enriched.employmentHistoryStatus || '').toLowerCase() !== 'terminated';
        const hireDate = enriched.hireDate ? new Date(enriched.hireDate) : null;
        const tenureDays = hireDate ? Math.floor((now - hireDate) / (1000 * 60 * 60 * 24)) : 0;

        return {
          tool_name: 'BambooHR',
          user_email: e.workEmail,
          user_name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.workEmail,
          last_active_date: now.toISOString().split('T')[0],
          days_active_last_30: isActive ? 30 : 0,
          activity_score: isActive ? 80 : 5,
          status: isActive ? 'Active' : 'Inactive',
          wasted_cost_flag: !isActive,
          source: 'live',
          // Store department + title as extra context via user_name field
          user_name: `${e.firstName || ''} ${e.lastName || ''}`.trim() +
            (enriched.department ? ` · ${enriched.department}` : '') +
            (enriched.jobTitle ? ` (${enriched.jobTitle})` : ''),
        };
      });

    // Also store a headcount summary as a UserActivity aggregate record
    const headcountRecord = {
      tool_name: 'BambooHR',
      user_email: 'headcount@bamboohr',
      user_name: 'Headcount Snapshot',
      activity_score: 100,
      status: 'Active',
      source: 'live',
      // Store active headcount in days_active_last_30 as a proxy count
      days_active_last_30: activityRecords.filter((r) => r.status === 'Active').length,
      wasted_cost_flag: false,
    };

    // Upsert all records
    const existing = await base44.asServiceRole.entities.UserActivity.filter({ tool_name: 'BambooHR', created_by_id: user.id });
    const existingByEmail = new Map(existing.map((e) => [e.user_email, e.id]));

    let created = 0, updated = 0;
    for (const record of [...activityRecords, headcountRecord]) {
      if (existingByEmail.has(record.user_email)) {
        await base44.asServiceRole.entities.UserActivity.update(existingByEmail.get(record.user_email), record);
        updated++;
      } else {
        await base44.asServiceRole.entities.UserActivity.create({ ...record, created_by_id: user.id });
        created++;
      }
    }

    const activeCount = activityRecords.filter((r) => r.status === 'Active').length;
    return Response.json({
      success: true,
      total: activityRecords.length,
      active_headcount: activeCount,
      created,
      updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}