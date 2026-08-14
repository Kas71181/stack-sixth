import { Database, ShieldAlert } from "lucide-react";
import CoverageGrid from "@/components/evidence/CoverageGrid";
import EvidenceBadge from "@/components/evidence/EvidenceBadge";
import EvidenceLoading from "@/components/evidence/EvidenceLoading";
import useEvidenceAnalytics from "@/hooks/useEvidenceAnalytics";

const fields = ["ownership", "access", "usage", "financial", "contract"];

export default function MyStackEvidencePanel() {
  const { data, isLoading, isError } = useEvidenceAnalytics();
  if (isLoading) return <EvidenceLoading />;
  if (isError) return <div className="glass-card p-5 text-sm text-destructive">Evidence data could not be loaded.</div>;
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5"><Database className="h-5 w-5 text-primary" /></div>
        <div><h2 className="text-lg font-bold">Evidence coverage</h2><p className="text-sm text-muted-foreground">Every application is scored by the source types actually present.</p></div>
      </div>
      <CoverageGrid coverage={data.coverage} />
      <div className="glass-card overflow-hidden">
        {data.applications.map((item) => (
          <div key={item.id} className="border-b border-border/50 p-4 last:border-b-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">Canonical ID: {item.canonicalAppId}</p></div>
              <div className="flex flex-wrap gap-1.5">{fields.map((field) => <EvidenceBadge key={field} value={item.statuses[field]} />)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldAlert className="h-4 w-4" />Observed and discovered records never become verified usage automatically.</div>
    </div>
  );
}