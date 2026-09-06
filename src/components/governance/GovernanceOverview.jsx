import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardCheck, FileClock, UserRoundX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function GovernanceOverview({ onSelect }) {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["governance-overview", user?.id], enabled: !!user?.id,
    queryFn: async () => (await base44.functions.invoke("getGovernanceOverview", {})).data,
  });
  if (isLoading) return <div className="py-16 text-center text-sm text-muted-foreground">Loading governance…</div>;
  const cards = [
    { label: "Purchase decisions", value: data?.pending || 0, icon: ClipboardCheck, tab: "purchases" },
    { label: "Renewals within 60 days", value: data?.renewals || 0, icon: FileClock, tab: "renewals" },
    { label: "Renewals without owners", value: data?.unassigned || 0, icon: UserRoundX, tab: "renewals" },
    { label: "Recorded decisions", value: data?.decisions || 0, icon: AlertTriangle, tab: "history" },
  ];
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon, tab }) => <button key={label} onClick={() => onSelect(tab)} className="stat-card items-start text-left"><Icon className="mb-2 h-5 w-5 text-primary" /><span className="text-2xl font-black">{value}</span><span className="text-xs text-muted-foreground">{label}</span></button>)}</div>;
}