import { BadgeDollarSign, CalendarClock, ListChecks, ShieldCheck } from "lucide-react";
import EvidenceLoading from "@/components/evidence/EvidenceLoading";
import useEvidenceAnalytics from "@/hooks/useEvidenceAnalytics";

export default function EvidenceSavingsOverview() {
  const { data, isLoading, isError } = useEvidenceAnalytics();
  if (isLoading) return <EvidenceLoading />;
  if (isError) return <div className="glass-card p-5 text-sm text-destructive">Savings evidence could not be loaded.</div>;
  const cards = [
    { label: "Ready to capture", value: `$${data.summary.verifiedSavings.toLocaleString()}/mo`, icon: BadgeDollarSign },
    { label: "Renewal opportunity", value: `$${data.summary.renewalOpportunity.toLocaleString()}/mo`, icon: CalendarClock },
    { label: "Optimization candidates", value: data.summary.optimizationCandidates, icon: ListChecks },
    { label: "Evidence coverage", value: `${data.coverage.overall}%`, icon: ShieldCheck },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="stat-card"><Icon className="h-4 w-4 text-primary" /><p className="mt-2 font-mono text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
      <div className="glass-card border-primary/20 bg-primary/5 p-5"><p className="font-semibold">No evidence, no claim</p><p className="mt-1 text-sm text-muted-foreground">Savings appear only when verified reclaimable units and verified marginal financial impact are both present. Candidates without that proof remain unpriced.</p></div>
    </div>
  );
}