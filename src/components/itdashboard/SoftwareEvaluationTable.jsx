import { CheckCircle2, XCircle, Clock, ChevronRight, Star } from "lucide-react";

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

const DecisionBadge = ({ decision }) => {
  if (decision === "approve")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  if (decision === "reject")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  if (decision === "defer")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" /> Deferred
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
};

export default function SoftwareEvaluationTable({ tools, selectedRec, onSelect }) {
  if (tools.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl flex items-center justify-center py-16 text-muted-foreground text-sm">
        No tools to display.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border/40">
        <h2 className="font-semibold text-sm">Software Recommendations ({tools.length})</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Click a row to review and make a decision</p>
      </div>
      <div className="divide-y divide-border/40">
        {tools.map((tool, i) => {
          const isSelected = selectedRec === tool;
          return (
            <button
              key={`${tool._auditId}-${tool._recIdx}`}
              onClick={() => onSelect(isSelected ? null : tool)}
              className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors group ${
                isSelected ? "bg-accent/60" : "hover:bg-muted/40"
              }`}
            >
              {/* Match score */}
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex flex-col items-center justify-center flex-shrink-0">
                <Star className="w-3 h-3 text-primary mb-0.5" />
                <span className="text-[10px] font-bold text-primary">{tool.match_score || "—"}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{tool.name}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tool.category}</span>
                  {tool.implementation_priority && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[tool.implementation_priority] || PRIORITY_COLORS.Low}`}>
                      {tool.implementation_priority}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{tool._auditName}</p>
              </div>

              {/* Savings */}
              {tool.estimated_savings_opportunity > 0 && (
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-muted-foreground">Saves</p>
                  <p className="text-sm font-semibold font-mono text-primary">
                    ${tool.estimated_savings_opportunity}/mo
                  </p>
                </div>
              )}

              {/* Decision */}
              <div className="flex-shrink-0">
                <DecisionBadge decision={tool._decision} />
              </div>

              <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? "rotate-90 text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}