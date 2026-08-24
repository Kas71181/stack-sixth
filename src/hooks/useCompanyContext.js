import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function useCompanyContext() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['company-context', user?.id],
    queryFn: async () => (await base44.entities.Company.filter({}, '-created_date', 10))[0] || null,
    enabled: !!user?.id,
  });
  const email = String(user?.email || '').toLowerCase();
  const company = query.data;
  const isManager = !!company && (company.owner_user_id === user?.id || company.created_by_id === user?.id || (company.manager_ids || []).includes(user?.id) || (company.manager_emails || []).map((item) => item.toLowerCase()).includes(email));
  return { ...query, company, isManager };
}