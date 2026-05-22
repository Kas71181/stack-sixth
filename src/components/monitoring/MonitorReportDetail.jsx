import { X, AlertTriangle, CheckCircle2, Clock, TrendingUp, DollarSign, Activity } from "lucide-react";

function formatCurrency(val) {
  if (val == null) return "—";
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${Math.round(val)}`;
}

const TOOL_STATUS = {
  adopted: { label: "Adopted", color: "text-primary bg-primary/10 border-primary/20", icon: CheckCircle2 },
  pending: { label: "Pending", color: "text-yellow-700 bg-yellow-50 border-yellow-200", icon: Clock },
  skipped: { label: "Skipped", color: "text-muted-foreground bg-muted border-border", icon: Clock },
  at_risk: { label: "At Risk", color: "text-destructive bg-destructive/10 border-destructive/20", icon: AlertTriangle },
};

export default function MonitorReportDetail({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="bg-card border border-primary/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-base">{report.company_name} — {report.report_period}</h3>
            <p className="text-xs text-muted-foreground">Monitoring Report</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Estimated Spend" value={`${formatCurrency(report.total_spend)}/mo`} icon={DollarSign} />
          <StatTile label="Flagged Tools" value={report.flagged_tools ?? 0} icon={AlertTriangle} highlight={report.flagged_tools > 0} />
          <StatTile label="Savings Available" value={`${formatCurrency(report.savings_identified)}/mo`} icon={TrendingUp} green />
        </div>

        {/* Summary text */}
        {report.report_summary && (
          <div className="bg-accent/40 border border-primary/10 rounded-xl p-4">
            <p className="text-sm leading-relaxed">{report.report_summary}</p>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Action Items This Period</p>
            <div className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools snapshot */}
        {report.tools_snapshot?.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Tool Status Snapshot</p>
            <div className="space-y-2">
              {report.tools_snapshot.map((tool, i) => {
                const s = TOOL_STATUS[tool.status] || TOOL_STATUS.pending;
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center justify-between bg-muted/40 rounded-xl px-4 py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${s.color.split(" ")[0]}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tool.name}</p>
                        {tool.category && <p className="text-xs text-muted-foreground">{tool.category}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      {tool.risk_flag && (
                        <p className="text-xs text-destructive max-w-[140px] text-right">{tool.risk_flag}</p>
                      )}
                      {tool.monthly_cost != null && (
                        <p className="text-xs font-mono font-medium">{formatCurrency(tool.monthly_cost)}/mo</p>
                      )}
                      {tool.usage_score != null && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${tool.usage_score >= 70 ? "bg-primary" : tool.usage_score >= 40 ? "bg-yellow-400" : "bg-destructive"}`}
                              style={{ width: `${tool.usage_score}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{tool.usage_score}%</span>
                        </div>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, highlight, green }) {
  return (
    <div className={`rounded-xl p-3 border ${green ? "bg-primary/5 border-primary/20" : highlight ? "bg-destructive/5 border-destructive/20" : "bg-muted/40 border-border/60"}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base font-bold font-mono ${green ? "text-primary" : highlight ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}