import { ShieldCheck } from "lucide-react";
import useEvidenceAnalytics from "@/hooks/useEvidenceAnalytics";

export default function EvidenceSummaryStrip() {
  const { data, isLoading, isError } = useEvidenceAnalytics();
  if (isLoading || isError || !data) return null;
  return (
    <div className="glass-card flex flex-col gap-3 border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2"><ShieldCheck className="h-5 w-5 text-primary" /></div><div><p className="text-sm font-semibold">Evidence foundation</p><p className="text-xs text-muted-foreground">{data.summary.totalApplications} canonical apps · {data.coverage.overall}% overall coverage</p></div></div>
      <div className="flex gap-5 text-xs"><span><strong className="font-mono text-sm">{data.summary.dormantSeats}</strong><br /><span className="text-muted-foreground">Dormant seats</span></span><span><strong className="font-mono text-sm">${data.summary.verifiedSavings}</strong><br /><span className="text-muted-foreground">Verified monthly savings</span></span><span><strong className="font-mono text-sm">{data.summary.utilization ?? "N/A"}</strong><br /><span className="text-muted-foreground">Utilization {data.summary.utilization === null ? "unavailable" : "%"}</span></span></div>
    </div>
  );
}