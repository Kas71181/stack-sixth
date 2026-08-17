import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import RawUsageFilters from "@/components/usage/RawUsageFilters";
import RawUsageTable from "@/components/usage/RawUsageTable";

export default function UsageEvidenceAdmin() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ application: "", user: "", provider: "", organization: "" });
  const { data = [], isLoading } = useQuery({ queryKey: ["raw-usage-events", user?.id], queryFn: () => base44.entities.UsageEvent.list("-occurred_at", 250), enabled: user?.role === "admin" });
  const events = useMemo(() => data.filter((event) => (!filters.application || (event.canonical_app_id || "").includes(filters.application.toLowerCase())) && (!filters.user || `${event.canonical_user_id || ""} ${event.provider_user_id || ""}`.toLowerCase().includes(filters.user.toLowerCase())) && (!filters.provider || (event.provider || "").toLowerCase().includes(filters.provider.toLowerCase())) && (!filters.organization || event.organization_id === filters.organization)), [data, filters]);
  if (user?.role !== "admin") return <div className="glass-card p-6 text-sm text-muted-foreground">Administrator access is required.</div>;
  return <div className="space-y-5"><div className="flex items-start gap-3"><div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5"><Activity className="h-5 w-5 text-primary" /></div><div><h1 className="text-page">Usage evidence inspector</h1><p className="text-sm text-muted-foreground">Inspect raw provider events and their normalized identities, applications, and evidence classification.</p></div></div><RawUsageFilters filters={filters} onChange={setFilters} />{isLoading ? <div className="skeleton h-40 rounded-2xl" /> : events.length ? <RawUsageTable events={events} /> : <div className="glass-card p-8 text-center text-sm text-muted-foreground">No usage events match these filters.</div>}</div>;
}