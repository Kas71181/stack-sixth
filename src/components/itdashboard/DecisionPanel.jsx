import { CheckCircle2, XCircle, Clock, X, Loader2, AlertTriangle, Info, DollarSign, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const RISK_COLORS = {
  Low: "text-green-600 bg-green-50",
  Medium: "text-amber-600 bg-amber-50",
  High: "text-red-600 bg-red-50",
};

export default function DecisionPanel({ tool, onDecision, isSaving, onClose }) {
  if (!tool) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col items-center justify-center h-full min-h-[300px] text-center text-muted-foreground">
        <Info className="w-8 h-8 mb-3 opacity-30" />
        <p className="text-sm font-medium">Select a tool</p>
        <p className="text-xs mt-1">Click any row to review details and make a decision</p>
      </div>
    );
  }

  const current = tool._decision;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden sticky top-24">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{tool.name}</p>
          <p className="text-xs text-muted-foreground">{tool.category} · {tool._auditName}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {/* Match score + cost */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Match Score</p>
            <p className="text-2xl font-bold text-primary">{tool.match_score || "—"}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Est. Cost</p>
            <p className="text-2xl font-bold font-mono">
              {tool.estimated_monthly_cost != null ? `$${tool.estimated_monthly_cost}` : "—"}
            </p>
          </div>
        </div>

        {/* Savings */}
        {tool.estimated_savings_opportunity > 0 && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 rounded-xl p-3">
            <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Potential savings</p>
              <p className="text-sm font-semibold text-primary">${tool.estimated_savings_opportunity}/mo</p>
            </div>
          </div>
        )}

        {/* Savings / ROI note */}
        {tool.savings_or_roi_note && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">ROI Note</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{tool.savings_or_roi_note}</p>
          </div>
        )}

        {/* Why it fits */}
        {tool.why_it_fits?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Why It Fits</p>
            <ul className="space-y-1.5">
              {tool.why_it_fits.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Integration notes */}
        {tool.integration_notes?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Integration Notes</p>
            <ul className="space-y-1.5">
              {tool.integration_notes.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Link2 className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Migration risk */}
        {tool.migration_risk && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${RISK_COLORS[tool.migration_risk] || RISK_COLORS.Low}`}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">Migration Risk:</span>
            <span>{tool.migration_risk}</span>
          </div>
        )}

        {/* Replaces */}
        {tool.replacement_candidate_for && (
          <div className="bg-muted/50 rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Replaces: <span className="font-medium text-foreground">{tool.replacement_candidate_for}</span>
          </div>
        )}

        {/* Adopt now/later */}
        {tool.adopt_now_or_later && (
          <div className="bg-muted/50 rounded-xl px-3 py-2 text-xs">
            <span className="text-muted-foreground">Timing: </span>
            <span className="font-medium">{tool.adopt_now_or_later}</span>
          </div>
        )}
      </div>

      {/* Decision buttons */}
      <div className="px-5 py-4 border-t border-border/40 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Executive Decision</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            onClick={() => onDecision(tool, "approve")}
            disabled={isSaving}
            className={`gap-1.5 text-xs rounded-lg ${current === "approve" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"}`}
            variant="ghost"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Approve
          </Button>
          <Button
            size="sm"
            onClick={() => onDecision(tool, "defer")}
            disabled={isSaving}
            className={`gap-1.5 text-xs rounded-lg ${current === "defer" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"}`}
            variant="ghost"
          >
            <Clock className="w-3 h-3" />
            Defer
          </Button>
          <Button
            size="sm"
            onClick={() => onDecision(tool, "reject")}
            disabled={isSaving}
            className={`gap-1.5 text-xs rounded-lg ${current === "reject" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"}`}
            variant="ghost"
          >
            <XCircle className="w-3 h-3" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}