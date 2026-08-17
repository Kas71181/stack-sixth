import { Activity, ShieldQuestion } from "lucide-react";
import EvidenceBadge from "@/components/evidence/EvidenceBadge";
import EvidenceLoading from "@/components/evidence/EvidenceLoading";
import useEvidenceAnalytics from "@/hooks/useEvidenceAnalytics";

export default function EvidenceUsagePanel() {
  const { data, isLoading, isError } = useEvidenceAnalytics();
  if (isLoading) return <EvidenceLoading />;
  if (isError) return <div className="glass-card p-5 text-sm text-destructive">Usage evidence could not be loaded.</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5"><Activity className="h-5 w-5 text-primary" /></div>
        <div><h2 className="text-lg font-bold">Verified usage</h2><p className="text-sm text-muted-foreground">Dormancy requires assigned seats, fresh supported activity, and a complete observation window.</p></div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {data.applications.map((item) => (
          <div key={item.id} className="glass-card p-5">
            <div className="flex items-center justify-between gap-3"><p className="font-semibold">{item.name}</p><EvidenceBadge value={item.statuses.usage} /></div>
            <div className="mt-4 grid grid-cols-4 gap-3 text-center">
              <div><p className="font-mono text-lg font-bold">{item.assignedSeats}</p><p className="text-[10px] text-muted-foreground">Assigned</p></div>
              <div><p className="font-mono text-lg font-bold">{item.verifiedAccessOnlySeats}</p><p className="text-[10px] text-muted-foreground">Access only</p></div>
              <div><p className="font-mono text-lg font-bold">{item.activeSeats}</p><p className="text-[10px] text-muted-foreground">Active</p></div>
              <div><p className="font-mono text-lg font-bold">{item.dormantSeats}</p><p className="text-[10px] text-muted-foreground">Dormant</p></div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"><ShieldQuestion className="h-4 w-4" />Usage coverage: {item.usageCoverage}% · Utilization: {item.utilization === null ? "Insufficient evidence" : `${item.utilization}%`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}