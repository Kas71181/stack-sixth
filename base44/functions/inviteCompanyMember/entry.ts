import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrganizationContext } from '../../shared/organizationContext.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const context = await resolveOrganizationContext(base44, user);
    if (!context?.isManager) return Response.json({ error: 'Company manager access required' }, { status: 403 });
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const companyRole = body.company_role === 'manager' ? 'manager' : 'member';
    if (!email || !email.includes('@')) return Response.json({ error: 'A valid email is required' }, { status: 400 });

    const memberEmails = [...new Set([...context.memberEmails, email])];
    const managerEmails = companyRole === 'manager' ? [...new Set([...context.managerEmails, email])] : context.managerEmails;
    await base44.asServiceRole.entities.Company.update(context.companyId, { member_emails: memberEmails, manager_emails: managerEmails });

    const requests = await base44.asServiceRole.entities.PurchaseRequest.filter({ company_id: context.companyId });
    if (requests.length) await base44.asServiceRole.entities.PurchaseRequest.bulkUpdate(requests.map((item) => ({ id: item.id, company_member_emails: memberEmails, company_manager_emails: managerEmails })));
    return Response.json({ success: true, company_id: context.companyId, company_role: companyRole });
  } catch (error) {
    console.error('Company invitation scope failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}