import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
export default function ActiveSubscriptionGate({ children }) {
  const { data, isLoading } = useQuery({ queryKey: ["subscription-access"], queryFn: async () => (await base44.functions.invoke("getSubscriptionAccess", {})).data, staleTime: 0, refetchOnMount: "always" });
  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Checking access…</div>;
  if (!data?.read_only) return children;
  return <div className="glass-card mx-auto max-w-xl p-10 text-center"><h2 className="text-2xl font-extrabold">Your Stack Sixth access has ended</h2><p className="mt-3 text-sm text-muted-foreground">Your software intelligence is still here. Choose a plan to reactivate monitoring and recommendations.</p><Link to="/pricing" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Reactivate Stack Sixth</Link></div>;
}