import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PlanAdminRow from "@/components/admin/PlanAdminRow";
export default function PlansAdmin() {
  const qc = useQueryClient();
  const { data: plans = [] } = useQuery({ queryKey: ["admin-plans"], queryFn: () => base44.entities.PlanDefinition.list("sort_order", 20) });
  return <div className="space-y-3">{plans.map((plan) => <PlanAdminRow key={plan.id} plan={plan} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-plans"] })} />)}</div>;
}