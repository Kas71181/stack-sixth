import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleDollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import EvidenceBadge from "@/components/evidence/EvidenceBadge";
import { withoutLongDashes } from "@/lib/textFormatting";

export default function EvidenceRecommendations() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({ queryKey: ["evidence-recommendations", user?.id], queryFn: () => base44.entities.Recommendation.filter({ created_by_id: user.id, status: "Open" }, "-created_date", 100), enabled: !!user?.id });
  if (isLoading) return <div className="skeleton h-32 rounded-2xl" />;
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.id} className="glass-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{item.tool_name}</p><p className="mt-1 text-sm text-muted-foreground"><strong className="text-foreground">What we found:</strong> {withoutLongDashes(item.description)}</p></div><EvidenceBadge value={item.evidence_level} /></div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs"><span className="badge-pill bg-muted text-muted-foreground">{item.financial_impact_status?.replaceAll("_", " ").toLowerCase()}</span>{item.financial_impact != null && item.validation_status === "valid" && <span className="flex items-center gap-1 font-mono font-bold text-emerald-700 dark:text-emerald-300"><CircleDollarSign className="h-4 w-4" />${item.financial_impact.toLocaleString()}/mo</span>}<span className="badge-pill bg-primary/10 text-primary">Confidence: {item.confidence_level || "insufficient"}</span></div>
          <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3 text-xs font-medium"><ArrowRight className="h-3.5 w-3.5 text-primary" /><span><strong>Next action:</strong> {withoutLongDashes(item.recommended_action)}</span></div>
          <p className="mt-2 text-[10px] text-muted-foreground">Method: {item.calculation_method || "Insufficient evidence"} · {item.evidence_sources?.length || 0} source record(s)</p>
        </div>
      ))}
      {!data.length && <div className="glass-card p-8 text-center text-sm text-muted-foreground">No open evidence-backed recommendations.</div>}
    </div>
  );
}