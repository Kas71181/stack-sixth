import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
export default function SubscriptionStatusBanner({ enabled }) {
  const { data } = useQuery({ queryKey: ["subscription-access"], queryFn: async () => (await base44.functions.invoke("getSubscriptionAccess", {})).data, enabled });
  if (!data) return null;
  const subscription = data.subscription;
  if (data.read_only) return <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"><strong>Your Stack Sixth access has ended.</strong> Your software intelligence is still here. <Link to="/pricing" className="ml-2 font-bold underline">Reactivate Stack Sixth</Link></div>;
  if (!["FREE", "PROMOTIONAL"].includes(subscription.subscription_status)) return null;
  return <div className="border-b border-primary/15 bg-primary/5 px-4 py-2 text-center text-xs text-foreground"><strong>{subscription.subscription_status === "PROMOTIONAL" ? `${subscription.promotional_partner} Partner Access` : "Free Launch"}</strong>{data.days_remaining !== null && ` · ${data.days_remaining} days remaining`}<Link to="/pricing" className="ml-2 font-bold text-primary hover:underline">Choose My Plan</Link></div>;
}