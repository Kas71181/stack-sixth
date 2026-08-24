import { useState } from "react";
import { BadgeDollarSign, ListChecks } from "lucide-react";
import EvidenceSavingsOverview from "@/components/evidence/EvidenceSavingsOverview";
import EvidenceRecommendations from "@/components/evidence/EvidenceRecommendations";
import CostReviewPanel from "@/components/evidence/CostReviewPanel";

export default function Savings() {
  const [view, setView] = useState(() => new URLSearchParams(window.location.search).get("view") === "recommendations" ? "recommendations" : "overview");
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-extrabold tracking-tight">Savings</h1><p className="mt-1 text-sm text-muted-foreground">Verified impact is separated from renewal opportunities and unpriced candidates.</p></div>
      <div className="tab-track flex w-fit">
        <button onClick={() => setView("overview")} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold active:scale-[0.96] ${view === "overview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><BadgeDollarSign className="h-4 w-4" />Overview</button>
        <button onClick={() => setView("recommendations")} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold active:scale-[0.96] ${view === "recommendations" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><ListChecks className="h-4 w-4" />Recommendations</button>
      </div>
      {view === "overview" ? <><EvidenceSavingsOverview /><CostReviewPanel /></> : <EvidenceRecommendations />}
    </div>
  );
}