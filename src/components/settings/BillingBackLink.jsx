import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function BillingBackLink() {
  const { data } = useQuery({
    queryKey: ["settings-subscription"],
    queryFn: async () => (await base44.functions.invoke("getSubscriptionAccess", {})).data,
    staleTime: 0,
  });
  const readOnly = data?.read_only;
  return <Link to={readOnly ? "/pricing" : "/app"} className="text-sm font-bold text-primary">{readOnly ? "Back to pricing" : "Back to app"}</Link>;
}