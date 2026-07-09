import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Cross-references UserActivity emails against BambooHR active employee list.
// Flags seats assigned to users no longer in the company as "offboarded".
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    let user;
    if (body._targetUserId) {
      user = await base44.asServiceRole.entities.User.get(body._targetUserId);
    } else {
      user = await base44.auth.me();
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get BambooHR records — these contain the active employee email list
    const bamboohrRecords = await base44.asServiceRole.entities.UserActivity.filter({
      tool_name: 'BambooHR',
      created_by_id: user.id,
      source: 'live',
    });

    const activeEmployeeEmails = new Set(
      bamboohrRecords
        .filter((r) => r.status === 'Active' && r.user_email && !r.user_email.includes('@bamboohr'))
        .map((r) => r.user_email.toLowerCase().trim())
    );

    if (activeEmployeeEmails.size === 0) {
      return Response.json({
        success: false,
        not_configured: true,
        error: 'BambooHR not connected. Connect BambooHR in Data Coverage to enable HRIS reconciliation.',
      });
    }

    // 2. Get all other live UserActivity records for this user
    const allActivity = await base44.asServiceRole.entities.UserActivity.filter({
      created_by_id: user.id,
      source: 'live',
    });

    const otherActivity = allActivity.filter(
      (r) =>
        r.tool_name !== 'BambooHR' &&
        r.user_email &&
        r.user_email !== 'aggregate@placeholder' &&
        r.user_email !== 'headcount@bamboohr'
    );

    // 3. Flag offboarded users and un-flag returning users
    let flagged = 0;
    let unflagged = 0;
    const offboardedByTool = {};

    for (const record of otherActivity) {
      const email = record.user_email?.toLowerCase().trim();
      const isOffboarded = !activeEmployeeEmails.has(email);

      if (isOffboarded && !record.offboarded_flag) {
        await base44.asServiceRole.entities.UserActivity.update(record.id, {
          offboarded_flag: true,
          wasted_cost_flag: true,
        });
        flagged++;
        offboardedByTool[record.tool_name] = (offboardedByTool[record.tool_name] || 0) + 1;
      } else if (!isOffboarded && record.offboarded_flag) {
        await base44.asServiceRole.entities.UserActivity.update(record.id, {
          offboarded_flag: false,
        });
        unflagged++;
      }
    }

    return Response.json({
      success: true,
      activeEmployees: activeEmployeeEmails.size,
      totalRecordsChecked: otherActivity.length,
      flagged,
      unflagged,
      offboardedByTool,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});