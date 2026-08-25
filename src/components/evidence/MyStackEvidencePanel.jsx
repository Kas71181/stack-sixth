import { Database, ShieldAlert } from "lucide-react";
import EvidenceLoading from "@/components/evidence/EvidenceLoading";
import EvidenceWasteTable from "@/components/evidence/EvidenceWasteTable";
import UsageMetricCard from "@/components/evidence/UsageMetricCard";
import useEvidenceAnalytics from "@/hooks/useEvidenceAnalytics";

export default function MyStackEvidencePanel() {
  const { data, isLoading, isError } = useEvidenceAnalytics();
  if (isLoading) return <EvidenceLoading />;
  if (isError) return <div className="glass-card p-5 text-sm text-destructive">Evidence data could not be loaded.</div>;
  const summary = data.summary;
  const hasVerifiedUsage = summary.verifiedUsageApplications > 0;
  const savings = summary.verifiedSavings == null ? "N/A" : `$${summary.verifiedSavings.toLocaleString()}`;
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5"><Database className="h-5 w-5 text-primary" /></div>
        <div><h2 className="text-lg font-bold">Evidence coverage</h2><p className="text-sm text-muted-foreground">Every application is scored by the source types actually present.</p></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UsageMetricCard label="Daily usage" value={hasVerifiedUsage ? summary.activeSeats : "N/A"} detail={hasVerifiedUsage ? "Verified active seats" : "Usage unavailable"} />
        <UsageMetricCard label="Dormant seats" value={hasVerifiedUsage ? summary.dormantSeats : "N/A"} detail={hasVerifiedUsage ? "License wastage candidates" : "Usage unavailable"} />
        <UsageMetricCard label="Utilization" value={summary.utilization == null ? "N/A" : `${summary.utilization}%`} detail="Across fully covered apps" />
        <UsageMetricCard label="Verified monthly savings" value={savings} detail="Ready to capture" tone="success" />
      </div>
      <EvidenceWasteTable applications={data.applications} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldAlert className="h-4 w-4" />Observed and discovered records never become verified usage automatically.</div>
    </section>
  );
}