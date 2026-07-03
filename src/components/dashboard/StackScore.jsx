import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Stack Score — a gamified 0-100 health metric for the user's SaaS stack.
 *
 * Factors (weighted):
 *  - Utilization: % of tools/seats that are active (not dormant)
 *  - Spend efficiency: savings found relative to total spend
 *  - Governance: contracts tracked vs tools in stack
 *  - Action health: low open/pending items = better
 *  - Coverage: live data source ratio
 *
 * Pure presentational — all data passed in as props.
 */
export default function StackScore({
  totalSpend = 0,
  totalSavings = 0,
  totalTools = 0,
  dormantTools = [],
  urgentRenewals = [],
  openRecs = [],
  userActivity = [],
}) {
  const { score, grade, tone, factors } = useMemo(() => {
    // ── Factor 1: Utilization (0-35 pts) ──
    const activityTools = [...new Set((userActivity || []).map((a) => a.tool_name))];
    const dormantCount = dormantTools.length;
    const trackedCount = Math.max(activityTools.length, totalTools, 1);
    const utilizationRate = Math.max(0, 1 - dormantCount / trackedCount);
    const utilizationPts = Math.round(utilizationRate * 35);

    // ── Factor 2: Spend efficiency (0-25 pts) ──
    // Reward finding savings — up to 25 pts when savings >= 15% of spend
    const savingsRatio = totalSpend > 0 ? totalSavings / totalSpend : 0;
    const efficiencyPts = Math.min(25, Math.round((savingsRatio / 0.15) * 25));

    // ── Factor 3: Governance (0-20 pts) ──
    // Fewer urgent renewals relative to total tools = better governance
    const renewalRatio = totalTools > 0 ? urgentRenewals.length / totalTools : 0;
    const governancePts = Math.round(Math.max(0, 1 - renewalRatio) * 20);

    // ── Factor 4: Action health (0-12 pts) ──
    // Fewer open recs = better (they've been addressed)
    const openCount = openRecs.length;
    const actionPts = openCount === 0 ? 12 : Math.max(0, 12 - openCount * 2);

    // ── Factor 5: Coverage (0-8 pts) ──
    const liveCount = [...new Set((userActivity || []).filter((a) => a.source === "live").map((a) => a.tool_name))].length;
    const coverageRatio = activityTools.length > 0 ? liveCount / activityTools.length : 0;
    const coveragePts = Math.round(coverageRatio * 8);

    const rawScore = utilizationPts + efficiencyPts + governancePts + actionPts + coveragePts;
    const finalScore = Math.max(0, Math.min(100, rawScore));

    let grade, tone;
    if (finalScore >= 85) { grade = "Excellent"; tone = "emerald"; }
    else if (finalScore >= 70) { grade = "Good"; tone = "primary"; }
    else if (finalScore >= 50) { grade = "Fair"; tone = "amber"; }
    else { grade = "Needs Work"; tone = "rose"; }

    const factors = [
      { label: "Utilization", pts: utilizationPts, max: 35, desc: `${dormantCount} dormant tool${dormantCount !== 1 ? "s" : ""}` },
      { label: "Spend Efficiency", pts: efficiencyPts, max: 25, desc: totalSavings > 0 ? `$${totalSavings.toLocaleString()}/mo found` : "No savings yet" },
      { label: "Renewal Governance", pts: governancePts, max: 20, desc: `${urgentRenewals.length} urgent` },
      { label: "Action Queue", pts: actionPts, max: 12, desc: `${openCount} open` },
      { label: "Data Coverage", pts: coveragePts, max: 8, desc: `${Math.round(coverageRatio * 100)}% live` },
    ];

    return { score: finalScore, grade, tone, factors };
  }, [totalSpend, totalSavings, totalTools, dormantTools, urgentRenewals, openRecs, userActivity]);

  const toneClasses = {
    emerald: { stroke: "stroke-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20" },
    primary: { stroke: "stroke-primary", text: "text-primary", bg: "bg-primary/10", glow: "shadow-primary/20" },
    amber: { stroke: "stroke-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" },
    rose: { stroke: "stroke-rose-500", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", glow: "shadow-rose-500/20" },
  };
  const t = toneClasses[tone];

  // SVG ring math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card rounded-xl p-5 border border-border/50 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Stack Score</p>
          <p className="text-sm font-bold mt-0.5">Health Rating</p>
        </div>
        <span className={`badge-pill ${t.bg} ${t.text} border border-current/15`}>{grade}</span>
      </div>

      {/* Score ring + breakdown */}
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={radius} className="stroke-muted/30" strokeWidth="8" fill="none" />
            <motion.circle
              cx="60" cy="60" r={radius}
              className={t.stroke}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className={`text-3xl font-extrabold font-mono tabular-nums ${t.text}`}
            >
              {score}
            </motion.span>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-foreground/80 w-24 flex-shrink-0 truncate">{f.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${t.bg.replace('/10', '/60')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.pts / f.max) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground w-12 text-right tabular-nums flex-shrink-0">
                {f.pts}/{f.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight footer */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-2">
        {score >= 70 ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        ) : score >= 50 ? (
          <Minus className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
        )}
        <p className="text-[11px] text-muted-foreground leading-snug">
          {score >= 85 && "Your stack is well-optimized — keep monitoring renewals."}
          {score >= 70 && score < 85 && "Solid shape — a few actions could push you higher."}
          {score >= 50 && score < 70 && "Several areas to improve — tackle your open actions first."}
          {score < 50 && "Needs attention — start by addressing dormant tools and renewals."}
        </p>
      </div>
    </div>
  );
}