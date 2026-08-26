import { ArrowRight, CheckCircle2, CircleDollarSign, Star } from "lucide-react";
import RecommendationDecision from "@/components/savings/RecommendationDecision";
import RecommendationReportDownloads from "@/components/recommendations/RecommendationReportDownloads";

export default function AuditRecommendationCard({ recommendation, index, onDecision, saving, existingSoftware = [], companyName = "" }) {
  const rec = recommendation;
  return (
    <article className="glass-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h3 className="font-bold">{rec.name}</h3><p className="text-xs text-muted-foreground">{rec.category}</p></div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-semibold"><Star className="h-3.5 w-3.5 fill-primary text-primary" />{rec.match_score || 0}% match</span>
          {rec.estimated_monthly_cost != null && <span className="font-mono font-semibold">${rec.estimated_monthly_cost}/mo</span>}
        </div>
      </div>
      {rec.replacement_candidate_for && <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"><ArrowRight className="h-3.5 w-3.5" />Alternative to {rec.replacement_candidate_for}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Why it fits</p><ul className="space-y-1.5">{(rec.why_it_fits || []).map((reason, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{reason}</li>)}</ul></div>
        <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">ROI note</p><p className="flex items-start gap-2 text-sm text-muted-foreground"><CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{rec.savings_or_roi_note || "ROI depends on final pricing and implementation scope."}</p></div>
      </div>
      <RecommendationReportDownloads recommendation={rec} existingSoftware={existingSoftware} companyName={companyName} />
      <div className="mt-4"><RecommendationDecision value={rec.decision_state} disabled={saving} onChange={(decision) => onDecision(index, decision)} /></div>
    </article>
  );
}