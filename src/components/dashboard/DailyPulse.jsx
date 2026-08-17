import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, RefreshCw, TrendingUp, Moon, CheckCircle2, Ghost } from "lucide-react";

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ── US Federal Holiday computation ──────────────────────────────────────────
// Floating holidays (Nth Monday / last Monday / Nth Thursday) are computed
// dynamically for the given year so they are always correct.

// Returns Date for the Nth occurrence of a given weekday in a month.
// weekday: 0=Sun, 1=Mon, … 6=Sat.  n: 1st, 2nd, 3rd, 4th, or -1 for last.
function nthWeekday(year, month, weekday, n) {
  if (n === -1) {
    // Last occurrence: start from last day of month, walk backwards
    const d = new Date(year, month + 1, 0);
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
    return d;
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, month, day);
}

function buildHolidays(year) {
  const mk = (date, name, emoji, extraDays = 0) => {
    const end = new Date(date);
    end.setDate(end.getDate() + extraDays);
    return {
      name, emoji,
      start: [date.getMonth() + 1, date.getDate()],
      end: [end.getMonth() + 1, end.getDate()],
    };
  };
  return [
    mk(new Date(year, 0, 1), "New Year's Day", "🎉", 0),
    mk(nthWeekday(year, 0, 1, 3), "Martin Luther King Jr. Day", "🕊️"),
    mk(nthWeekday(year, 1, 1, 3), "Presidents' Day", "🇺🇸"),
    mk(nthWeekday(year, 4, 1, -1), "Memorial Day", "🇺🇸"),
    mk(new Date(year, 5, 19), "Juneteenth", "✊", 0),
    mk(new Date(year, 6, 4), "Independence Day", "🇺🇸", 2), // through Jul 6
    mk(nthWeekday(year, 8, 1, 1), "Labor Day", "🔨"),
    mk(nthWeekday(year, 9, 1, 2), "Columbus Day", "⛵"),
    mk(new Date(year, 10, 11), "Veterans Day", "🎖️", 0),
    mk(nthWeekday(year, 10, 4, 4), "Thanksgiving", "🦃", 1), // incl. Black Friday
    mk(new Date(year, 11, 25), "Christmas", "🎄", 1),
  ];
}

function getActiveHoliday(date) {
  const year = date.getFullYear();
  // Check current year and adjacent year (for Dec→Jan boundary)
  for (const y of [year - 1, year, year + 1]) {
    for (const h of buildHolidays(y)) {
      const [sm, sd] = h.start;
      const [em, ed] = h.end;
      const start = new Date(y, sm - 1, sd);
      const end = new Date(y, em - 1, ed);
      if (date >= start && date <= end) return h;
    }
  }
  return null;
}

/**
 * Slim "morning briefing" strip — surfaces what needs attention today.
 * Sits above the existing dashboard; nothing below changes.
 */
export default function DailyPulse({
  pendingRequests = [],
  urgentRenewals = [],
  verifiedSavings = 0,
  dormantToolCount = 0,
  shadowToolCount = 0,
  isLoading = false,
}) {

  const today = new Date();
  const day = today.getDate();
  const dateStr = `${today.toLocaleDateString("en-US", { weekday: "long" })} ${day}${getOrdinal(day)} ${today.toLocaleDateString("en-US", { month: "long" })}, ${today.getFullYear()}`;
  const holiday = getActiveHoliday(today);
  const holidayStr = holiday ? `${holiday.emoji} ${holiday.name}` : null;

  if (isLoading) {
    return <div className="h-10 rounded-xl skeleton" aria-label="Loading today's verified pulse" />;
  }

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

  if (dormantToolCount > 0) {
    alerts.push({
      icon: Moon,
      label: `${dormantToolCount} dormant tool${dormantToolCount > 1 ? "s" : ""} with verified usage evidence`,
      to: "/monitoring",
      tone: "violet",
    });
  }

  if (shadowToolCount > 0) {
    alerts.push({
      icon: Ghost,
      label: `${shadowToolCount} shadow IT tool${shadowToolCount > 1 ? "s" : ""} detected`,
      to: "/data-coverage",
      tone: "rose",
    });
  }

  if (verifiedSavings > 0) {
    alerts.push({
      icon: TrendingUp,
      label: `$${verifiedSavings.toLocaleString()}/mo in verified savings ready to capture`,
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
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            You're all caught up — nothing needs your attention today.
          </p>
          <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
            {dateStr}{holidayStr ? ` · ${holidayStr}` : ""}
          </p>
        </div>
      </motion.div>
    );
  }

  const toneClasses = {
    primary: "bg-primary/8 border-primary/20 text-primary hover:bg-primary/12",
    amber: "bg-amber-500/8 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/12",
    violet: "bg-violet-500/8 border-violet-500/20 text-violet-700 dark:text-violet-400 hover:bg-violet-500/12",
    emerald: "bg-emerald-500/8 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/12",
    rose: "bg-rose-500/8 border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500/12",
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
      <span className="text-[11px] text-muted-foreground mr-1">
        · {dateStr}{holidayStr ? ` · ${holidayStr}` : ""}
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