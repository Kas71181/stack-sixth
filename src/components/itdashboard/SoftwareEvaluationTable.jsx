import { CheckCircle2, XCircle, Clock, ChevronRight, TrendingDown, Sparkles } from "lucide-react";

const PRIORITY_STYLES = {
  High: "bg-red-500/12 text-red-500 border border-red-500/25",
  Medium: "bg-amber-500/12 text-amber-500 border border-amber-500/25",
  Low: "bg-muted text-muted-foreground border border-border/60",
};

const DecisionBadge = ({ decision }) => {
  if (decision === "approve")
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/12 border border-emerald-500/25 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    );
  if (decision === "reject")
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-500/12 border border-red-500/25 px-2.5 py-1 rounded-full">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
  if (decision === "defer")
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/12 border border-amber-500/25 px-2.5 py-1 rounded-full">
        <Clock className="w-3 h-3" /> Deferred
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted border border-border/60 px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
};

const MatchScoreRing = ({ score }) => {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#d97706" : "#6366f1";
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${pct * 0.942} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color }}>
        {score || "–"}
      </span>
    </div>
  );
};

export default function SoftwareEvaluationTable({ tools, selectedRec, onSelect }) {
  if (tools.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Sparkles className="w-8 h-8 mb-3 opacity-20" />
        <p className="text-sm font-medium">No tools to display</p>
        <p className="text-xs mt-1 opacity-70">Try selecting a different audit filter</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Software Recommendations</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click a row to review details and make a decision</p>
          </div>
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {tools.length} tools
          </span>
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {tools.map((tool) => {
          const isSelected = selectedRec === tool;
          return (
            <button
              key={`${tool._auditId}-${tool._recIdx}`}
              onClick={() => onSelect(isSelected ? null : tool)}
              className={`w-full text-left px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 transition-all group ${
                isSelected
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "hover:bg-muted/30 border-l-2 border-l-transparent"
              }`}
            >
              <MatchScoreRing score={tool.match_score} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className={`font-semibold text-sm ${isSelected ? "text-primary" : ""}`}>{tool.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                    {tool.category}
                  </span>
                  {tool.implementation_priority && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[tool.implementation_priority] || PRIORITY_STYLES.Low}`}>
                      {tool.implementation_priority} Priority
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{tool._auditName}</p>
              </div>

              {tool.estimated_savings_opportunity > 0 && (
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="flex items-center gap-1 text-emerald-600 justify-end">
                    <TrendingDown className="w-3 h-3" />
                    <p className="text-sm font-bold font-mono">${tool.estimated_savings_opportunity}<span className="text-xs font-normal">/mo</span></p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">potential savings</p>
                </div>
              )}

              <div className="flex-shrink-0 hidden xs:block sm:block">
                <DecisionBadge decision={tool._decision} />
              </div>

              <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all ${
                isSelected ? "rotate-90 text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground"
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}