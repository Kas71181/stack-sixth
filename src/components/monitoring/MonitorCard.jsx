import { useState } from "react";
import { RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

function formatCurrency(val) {
  if (!val) return "—";
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${Math.round(val)}`;
}

const STATUS_STYLES = {
  generated: { label: "Report Ready", color: "text-primary bg-primary/10 border-primary/20" },
  pending: { label: "Pending", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  error: { label: "Error", color: "text-destructive bg-destructive/10 border-destructive/20" },
};

export default function MonitorCard({ audit, reports, isGenerating, onGenerate, onSelectReport, selectedReport }) {
  const [expanded, setExpanded] = useState(false);
  const latest = reports[0];

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">{audit.company_name}</h3>
            {latest && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[latest.status]?.color}`}>
                {STATUS_STYLES[latest.status]?.label}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {audit.team_size} people · ${audit.monthly_budget?.toLocaleString()}/mo budget
            {latest ? ` · Last report: ${latest.report_period}` : " · No reports yet"}
          </p>
        </div>

        {/* Stats from latest */}
        {latest?.status === "generated" && (
          <div className="flex items-center gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Spend Est.</p>
              <p className="text-sm font-bold font-mono">{formatCurrency(latest.total_spend)}/mo</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Flagged</p>
              <p className={`text-sm font-bold ${latest.flagged_tools > 0 ? "text-destructive" : "text-primary"}`}>
                {latest.flagged_tools ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Savings Available</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(latest.savings_identified)}/mo</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating…" : "Run Report"}
          </button>
          {reports.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-3 py-1.5 border border-border/60 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              History ({reports.length})
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Latest report summary */}
      {latest?.status === "generated" && latest.report_summary && (
        <div className="px-5 pb-4 border-t border-border/40 pt-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{latest.report_summary}</p>
          {latest.recommendations?.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {latest.recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {rec}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onSelectReport(selectedReport?.id === latest.id ? null : latest)}
            className="mt-3 text-xs text-primary font-semibold hover:underline"
          >
            {selectedReport?.id === latest.id ? "Hide full report ↑" : "View full report →"}
          </button>
        </div>
      )}

      {/* History list */}
      {expanded && reports.length > 0 && (
        <div className="border-t border-border/40 px-5 py-3 space-y-2 bg-muted/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Report History</p>
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/60 rounded-lg px-3 py-2 transition-colors"
              onClick={() => onSelectReport(selectedReport?.id === r.id ? null : r)}
            >
              <div className="flex items-center gap-2">
                {r.status === "generated" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="font-medium">{r.report_period}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {r.flagged_tools > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertTriangle className="w-3 h-3" /> {r.flagged_tools} flagged
                  </span>
                )}
                {r.savings_identified > 0 && (
                  <span className="flex items-center gap-1 text-primary">
                    <TrendingUp className="w-3 h-3" /> {formatCurrency(r.savings_identified)}/mo available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}