import { TrendingDown, CalendarClock, AlertTriangle, Users, DollarSign, ArrowRight, CheckCircle2, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

const SEVERITY_STYLES = {
  critical: { label: "Critical", cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
  high: { label: "High", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
  medium: { label: "Medium", cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" },
  low: { label: "Low", cls: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
};

const ACTION_LABELS = {
  downgrade: "Downgrade Plan",
  cancel: "Cancel Contract",
  review: "Review Usage",
  renew: "Renew",
  negotiate: "Negotiate",
  urgent_review: "Urgent Review",
};

export default function LifecycleAlertCard({ alert, onAction, isSaving }) {
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState(null);
  const isDormant = alert.type === "dormant";
  const isRenewal = alert.type === "renewal";
  const severity = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
  const Icon = isDormant ? TrendingDown : CalendarClock;

  return (
    <div className="glass-card overflow-hidden hover-lift">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        className="w-full p-4 flex items-center gap-3 cursor-pointer select-none"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          alert.severity === "critical" ? "bg-red-50 dark:bg-red-900/20" : alert.severity === "high" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted"
        }`}>
          <Icon className={`w-4 h-4 ${alert.severity === "critical" ? "text-red-500" : alert.severity === "high" ? "text-amber-500" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{alert.tool_name}</h3>
            <span className={`badge-pill border ${severity.cls} flex-shrink-0`}>{severity.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            {isDormant && (
              <>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {alert.inactive_pct}% inactive</span>
                <span>·</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${alert.wasted_cost}/mo wasted</span>
              </>
            )}
            {isRenewal && (
              <>
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {alert.days_until_renewal > 0 ? `${alert.days_until_renewal}d to renewal` : "Overdue"}</span>
                <span>·</span>
                <span className="font-mono">${alert.monthly_cost}/mo</span>
                {alert.auto_renews && <span className="text-amber-600 font-medium">auto-renews</span>}
              </>
            )}
          </div>
        </div>
        <ArrowRight className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`} />
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
          {/* Details */}
          {isDormant && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Active Users</p>
                <p className="font-bold text-sm mt-0.5 text-emerald-600">{alert.active_users}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Inactive</p>
                <p className="font-bold text-sm mt-0.5 text-red-500">{alert.inactive_users}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Avg Activity</p>
                <p className="font-bold text-sm mt-0.5">{alert.avg_activity_score}/100</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Seats</p>
                <p className="font-bold text-sm mt-0.5">{alert.licensed_seats}</p>
              </div>
            </div>
          )}

          {isRenewal && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Renewal Date</p>
                <p className="font-bold text-sm mt-0.5">{alert.renewal_date}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Monthly Cost</p>
                <p className="font-bold text-sm mt-0.5">${alert.monthly_cost}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Notice Period</p>
                <p className="font-bold text-sm mt-0.5">{alert.notice_period_days}d</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-muted-foreground">Activity</p>
                <p className="font-bold text-sm mt-0.5">{alert.avg_activity_score !== null ? `${alert.avg_activity_score}/100` : "N/A"}</p>
              </div>
            </div>
          )}

          {/* AI recommendation */}
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Recommended Action</p>
            <p className="text-sm">{ACTION_LABELS[alert.recommended_action] || "Review"}</p>
          </div>

          {/* Decision buttons */}
          {onAction && (
            <div className="flex flex-wrap gap-2 pt-1">
              {isDormant && (
                <>
                  <button
                    onClick={() => setAction("downgrade")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Downgrade
                  </button>
                  <button
                    onClick={() => setAction("cancel")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    onClick={() => setAction("dismiss")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Dismiss
                  </button>
                </>
              )}
              {isRenewal && (
                <>
                  <button
                    onClick={() => setAction("renew")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Renew
                  </button>
                  <button
                    onClick={() => setAction("negotiate")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Negotiate
                  </button>
                  <button
                    onClick={() => setAction("cancel")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {/* Confirm action */}
          {action && action !== "dismiss" && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onAction(alert, action)}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm {ACTION_LABELS[action] || action}
              </button>
              <button onClick={() => setAction(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          )}
          {action === "dismiss" && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onAction(alert, "dismiss")}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Dismiss
              </button>
              <button onClick={() => setAction(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}