import { X, Activity, RefreshCw } from "lucide-react";

export default function MonitorSetupModal({ audits, reports, onClose, onGenerate, generatingId }) {
  const auditsWithReports = new Set(reports.map((r) => r.audit_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/60 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Start Monitoring</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a completed audit to generate an initial monitoring report. Stack Sixth will periodically re-analyze your stack and flag new risks or savings.
          </p>

          <div className="space-y-2">
            {audits.map((audit) => {
              const hasReports = auditsWithReports.has(audit.id);
              const isGenerating = generatingId === audit.id;
              return (
                <div
                  key={audit.id}
                  className="flex items-center justify-between bg-muted/40 border border-border/60 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{audit.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {audit.team_size} people · ${audit.monthly_budget?.toLocaleString()}/mo
                      {hasReports ? " · Active" : " · Not yet monitored"}
                    </p>
                  </div>
                  <button
                    onClick={() => { onGenerate(audit.id); onClose(); }}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
                    {isGenerating ? "Running…" : hasReports ? "Re-run" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
            💡 Reports auto-generate monthly via a scheduled job. You can also manually trigger them anytime.
          </p>
        </div>
      </div>
    </div>
  );
}