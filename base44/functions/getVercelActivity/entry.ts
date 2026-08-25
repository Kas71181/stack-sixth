import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { authorizeTargetUser } from '../../shared/authorizeTargetUser.ts';
import { decryptCredential } from '../../shared/credentialCrypto.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const access = await authorizeTargetUser(base44, body);
    if (access.error) return access.error;

    const stored = await base44.asServiceRole.entities.ApiCredential.filter({ service: 'vercel', created_by_id: access.user.id });
    if (!stored[0]) return Response.json({ success: false, not_configured: true, error: 'Vercel token not configured' });
    const credential = await decryptCredential(stored[0]);
    if (!credential.api_key) return Response.json({ success: false, not_configured: true, error: 'Vercel token not configured' });

    const headers = { Authorization: `Bearer ${credential.api_key}` };
    const userResponse = await fetch('https://api.vercel.com/v2/user', { headers });
    if (!userResponse.ok) {
      const details = await userResponse.json().catch(() => ({}));
      return Response.json({ success: false, error: details?.error?.message || 'Vercel rejected this token' });
    }

    const projectsResponse = await fetch('https://api.vercel.com/v9/projects?limit=100', { headers });
    if (!projectsResponse.ok) {
      const details = await projectsResponse.json().catch(() => ({}));
      return Response.json({ success: false, error: details?.error?.message || 'Vercel project access could not be verified' });
    }
    const projects = await projectsResponse.json();
    const count = projects.projects?.length || 0;
    return Response.json({ success: true, evidence_type: 'access', evidence_note: `Verified Vercel API access to ${count} project${count === 1 ? '' : 's'}`, projects: count });
  } catch (error) {
    console.error('Vercel verification failed', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}