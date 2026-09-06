import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AuditRecommendationCard from "@/components/savings/AuditRecommendationCard";
import IndependentToolComparison from "@/components/comparison/IndependentToolComparison";
import AllRecommendationReportsDropdown from "@/components/recommendations/AllRecommendationReportsDropdown";

export default function EvidenceRecommendations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savingIndex, setSavingIndex] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [view, setView] = useState("recommendations");
  const { data: audit, isLoading } = useQuery({
    queryKey: ["latest-audit-recommendations", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await base44.functions.invoke("getReliableRecommendations", {})).data.audit,
  });
  const recommendations = audit?.analysis_result?.recommendations || [];
  const decide = async (index, decision, details = {}) => {
    setSavingIndex(index); setSaveError("");
    try { await base44.functions.invoke("saveRecommendationDecision", { auditId: audit.id, recommendationIndex: index, decision, details }); await queryClient.invalidateQueries({ queryKey: ["latest-audit-recommendations", user.id] }); }
    catch { setSaveError("The decision could not be saved. No recommendation state was changed."); }
    finally { setSavingIndex(null); }
  };
  if (isLoading) return <div className="skeleton h-32 rounded-2xl" />;
  const emptyRecommendations = <div className="glass-card p-8 text-center"><p className="font-semibold">No tool recommendations yet</p><p className="mt-1 text-sm text-muted-foreground">Run an audit using your tools, processes, purposes, and pricing to generate alternatives.</p><Link to="/audit" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.96]">Run an audit</Link></div>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="tab-track inline-flex gap-1">
          <button type="button" onClick={() => setView("recommendations")} className={`rounded-xl px-4 py-2 text-sm font-semibold active:scale-[0.96] ${view === "recommendations" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Recommendations</button>
          <button type="button" onClick={() => setView("compare")} className={`rounded-xl px-4 py-2 text-sm font-semibold active:scale-[0.96] ${view === "compare" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Compare tools</button>
        </div>
        {!!recommendations.length && <AllRecommendationReportsDropdown recommendations={recommendations} existingSoftware={audit?.existing_software || []} companyName={audit?.company_name || ""} />}
      </div>
      {saveError && <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{saveError}</p>}
      {audit?.analysis_result?.recommendations?.some((rec) => rec.freshness_status !== "current") && <p className="rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">These recommendations require revalidation because the supporting audit snapshot is missing or the software environment has changed.</p>}
      {view === "compare" ? (
        <IndependentToolComparison existingSoftware={audit?.existing_software || []} />
      ) : recommendations.length ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Based on the latest audit of your tools, their purposes, your processes, and pricing.</p>
          {recommendations.map((rec, index) => <AuditRecommendationCard key={`${rec.name}-${index}`} recommendation={rec} index={index} saving={savingIndex === index} onDecision={decide} />)}
        </div>
      ) : emptyRecommendations}
    </div>
  );
}