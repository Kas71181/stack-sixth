const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const unique = (values = []) => [...new Set(values.filter(Boolean))];

export async function resolveOrganizationContext(base44, user) {
  const service = base44.asServiceRole.entities;
  const email = normalizeEmail(user.email);
  let companies = await service.Company.filter({ owner_user_id: user.id });
  if (!companies[0]) companies = await service.Company.filter({ member_ids: user.id });
  if (!companies[0] && email) companies = await service.Company.filter({ member_emails: email });
  if (!companies[0]) companies = await service.Company.filter({ created_by_id: user.id });
  const company = companies[0];
  if (!company) return null;

  const memberIds = unique([...(company.member_ids || []), company.owner_user_id, company.created_by_id, user.id]);
  const memberEmails = unique([...(company.member_emails || []).map(normalizeEmail), email]);
  const managerIds = unique([...(company.manager_ids || []), company.owner_user_id, company.created_by_id]);
  const managerEmails = unique([...(company.manager_emails || []).map(normalizeEmail), company.created_by, company.owner_user_id === user.id ? email : null]);
  const changed = memberIds.length !== (company.member_ids || []).length || memberEmails.length !== (company.member_emails || []).length;
  if (changed) await service.Company.update(company.id, { member_ids: memberIds, member_emails: memberEmails, manager_ids: managerIds, manager_emails: managerEmails });

  const isManager = managerIds.includes(user.id) || managerEmails.includes(email);
  return { company: { ...company, member_ids: memberIds, member_emails: memberEmails, manager_ids: managerIds, manager_emails: managerEmails }, companyId: company.id, memberIds, memberEmails, managerIds, managerEmails, isManager };
}

export function companyScope(context) {
  return {
    company_id: context.companyId,
    company_member_ids: context.memberIds,
    company_member_emails: context.memberEmails,
    company_manager_ids: context.managerIds,
    company_manager_emails: context.managerEmails,
  };
}