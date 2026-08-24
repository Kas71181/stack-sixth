import { Lightbulb, X } from "lucide-react";
import { useState, useEffect } from "react";

// Generate contextual insight prompts from real user data
function buildInsights(audits, recommendations, monitorReports) {
  const insights = [];

  const open = (recommendations || []).filter((r) => r.status === "Open");
  const highPriority = open.filter((r) => r.priority === "High");
  const totalWaste = open.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);

  if (highPriority.length > 0) {
    insights.push({
      id: "high-priority",
      text: `You have ${highPriority.length} high-priority recommendation${highPriority.length > 1 ? "s" : ""} worth $${highPriority.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0).toLocaleString()}/mo. What should I do first?`,
      label: `${highPriority.length} high-priority actions`,
    });
  }

  if (totalWaste > 0) {
    insights.push({
      id: "total-waste",
      text: `I have $${totalWaste.toLocaleString()}/mo in potential savings identified. What's the fastest way to capture it?`,
      label: `$${totalWaste.toLocaleString()}/mo available`,
    });
  }

  const latestReport = (monitorReports || []).sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  if (latestReport?.flagged_tools > 0) {
    insights.push({
      id: "flagged-tools",
      text: `My latest monitoring report flagged ${latestReport.flagged_tools} tools. Can you explain what's at risk?`,
      label: `${latestReport.flagged_tools} flagged tools`,
    });
  }

  if ((audits || []).length > 1) {
    insights.push({
      id: "compare-audits",
      text: "How has my SaaS spend changed across my audits? Am I improving?",
      label: "Spend trend analysis",
    });
  }

  insights.push({
    id: "benchmark",
    text: "How does my SaaS spend compare to similar companies in my industry?",
    label: "Industry benchmarks",
  });

  return insights.slice(0, 4);
}

export default function ProactiveInsights({ audits, recommendations, monitorReports, onSelectInsight }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dismissed_insights") || "[]"); } catch { return []; }
  });

  const insights = buildInsights(audits, recommendations, monitorReports).filter((i) => !dismissed.includes(i.id));

  const dismiss = (id, e) => {
    e.stopPropagation();
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("dismissed_insights", JSON.stringify(next));
  };

  if (insights.length === 0) return null;

  return (
    <div className="mb-1">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Suggested questions</p>
      <div className="space-y-1.5">
        {insights.map((insight) => (
          <div
            key={insight.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectInsight(insight.text)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelectInsight(insight.text); }}
            className="w-full group flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-xl bg-accent/60 hover:bg-accent border border-border/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-foreground/80 font-medium truncate">{insight.label}</span>
            </div>
            <button
              onClick={(e) => dismiss(insight.id, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded hover:bg-muted"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}