import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, RefreshCw, TrendingUp, Moon, CheckCircle2 } from "lucide-react";

/**
 * Slim "morning briefing" strip — surfaces what needs attention today.
 * Sits above the existing dashboard; nothing below changes.
 */
export default function DailyPulse({
  pendingRequests = [],
  urgentRenewals = [],
  openRecs = [],
  dormantTools = [],
}) {
  const totalSavings = openRecs.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);

  const alerts = [];

  if (pendingRequests.length > 0) {
    alerts.push({
      icon: ClipboardList,
      label: `${pendingRequests.length} purchase request${pendingRequests.length > 1 ? "s" : ""} awaiting you`,
      to: "/purchase-requests",
      tone: "primary",
    });
  }

  if (urgentRenewals.length > 0) {
    alerts.push({
      icon: RefreshCw,
      label: `${urgentRenewals.length} renewal${urgentRenewals.length > 1 ? "s" : ""} due in 30 days`,
      to: "/lifecycle",
      tone: "amber",
    });
  }

  if (dormantTools.length > 0) {
    alerts.push({
      icon: Moon,
      label: `${dormantTools.length} dormant tool${dormantTools.length > 1 ? "s" : ""} wasting licenses`,
      to: "/monitoring",
      tone: "violet",
    });
  }

  if (totalSavings > 0) {
    alerts.push({
      icon: TrendingUp,
      label: `$${totalSavings.toLocaleString()}/mo in savings ready to capture`,
      to: "/it-dashboard",
      tone: "emerald",
    });
  }

  // No alerts — positive reinforcement
  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border border-emerald-300/40 dark:border-emerald-600/30"
        style={{ background: "rgba(16,185,129,0.06)" }}
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          You're all caught up — nothing needs your attention today.
        </p>
      </motion.div>
    );
  }

  const toneClasses = {
    primary: "bg-primary/8 border-primary/20 text-primary hover:bg-primary/12",
    amber: "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/12",
    violet: "bg-violet-500/8 border-violet-500/20 text-violet-700 dark:text-violet-400 hover:bg-violet-500/12",
    emerald: "bg-emerald-500/8 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/12",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground mr-1">
        Today's Pulse
      </span>
      {alerts.map((alert, i) => {
        const Icon = alert.icon;
        return (
          <Link
            key={i}
            to={alert.to}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 active:scale-[0.96] ${toneClasses[alert.tone]}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {alert.label}
          </Link>
        );
      })}
    </motion.div>
  );
}