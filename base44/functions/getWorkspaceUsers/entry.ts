import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain } = await req.json().catch(() => ({}));
    const stored = await base44.entities.ApiCredential.filter({ service: 'google_workspace', created_by_id: user.id });
    const accessToken = stored[0]?.api_key || null;

    if (!accessToken) {
      return Response.json({ error: 'Google Workspace access token not configured. Save it in Settings → API Credentials.' }, { status: 400 });
    }
    if (!domain) {
      return Response.json({ error: 'domain is required' }, { status: 400 });
    }

    // Fetch all users from Google Workspace Admin Directory API
    const usersRes = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/users?domain=${encodeURIComponent(domain)}&maxResults=500&projection=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!usersRes.ok) {
      const err = await usersRes.json();
      return Response.json({ error: err.error?.message || 'Google API error' }, { status: 400 });
    }

    const usersData = await usersRes.json();
    const users = usersData.users || [];

    // Analyze users for unused/idle seats
    const now = Date.now();
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    const analyzed = users.map((u) => {
      const lastLogin = u.lastLoginTime ? new Date(u.lastLoginTime).getTime() : null;
      const daysSinceLogin = lastLogin ? Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24)) : null;

      let status = 'active';
      if (!lastLogin || daysSinceLogin > 90) status = 'idle_90d';
      else if (daysSinceLogin > 30) status = 'idle_30d';
      if (u.suspended) status = 'suspended';

      return {
        email: u.primaryEmail,
        full_name: u.name?.fullName || '',
        suspended: u.suspended || false,
        is_admin: u.isAdmin || false,
        last_login: u.lastLoginTime || null,
        days_since_login: daysSinceLogin,
        status,
        org_unit: u.orgUnitPath || '/',
        licenses: u.licenses || [],
      };
    });

    const total = analyzed.length;
    const suspended = analyzed.filter((u) => u.status === 'suspended').length;
    const idle90 = analyzed.filter((u) => u.status === 'idle_90d').length;
    const idle30 = analyzed.filter((u) => u.status === 'idle_30d').length;
    const active = analyzed.filter((u) => u.status === 'active').length;

    return Response.json({
      users: analyzed,
      summary: { total, active, idle_30d: idle30, idle_90d: idle90, suspended },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}