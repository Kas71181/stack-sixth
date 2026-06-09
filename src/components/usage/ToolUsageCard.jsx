import { useState } from "react";
import { AlertTriangle, CheckCircle2, DollarSign, Users, TrendingUp } from "lucide-react";
import UserActivityDrilldown from "./UserActivityDrilldown";

function HealthGauge({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function MetricBar({ value, max, label, unit }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const STATUS_META = {
  Active:            { label: "Healthy", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle2 },
  Dormant:           { label: "At Risk", cls: "text-amber-700 bg-amber-50 border-amber-200",       Icon: AlertTriangle },
  Inactive:          { label: "Wasted",  cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
  "Never Logged In": { label: "Wasted",  cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
};

export default function ToolUsageCard({ tool }) {
  const [showDrilldown, setShowDrilldown] = useState(false);
  const score = tool.activity_score ?? 0;
  const meta = STATUS_META[tool.status] || STATUS_META.Dormant;
  const StatusIcon = meta.Icon;

  const utilRate = tool.licensed_seats > 0
    ? Math.round(((tool.active_users || 0) / tool.licensed_seats) * 100)
    : null;

  const wastedCost = tool.wasted_cost_flag && tool.license_cost_per_month
    ? tool.license_cost_per_month
    : null;

  // Live user breakdown (merged from DeepActivityMetrics)
  const liveUsers = tool.liveUsers || [];
  const hasLive = liveUsers.length > 0;
  const activeCount = liveUsers.filter((u) => u.status === "Active").length;
  const dormantCount = liveUsers.filter((u) => u.status === "Dormant").length;
  const inactiveCount = liveUsers.filter((u) => u.status === "Inactive" || u.status === "Never Logged In").length;
  const avgDays = hasLive ? Math.round(liveUsers.reduce((s, u) => s + (u.days_active_last_30 || 0), 0) / liveUsers.length) : null;
  const avgScore = hasLive ? Math.round(liveUsers.reduce((s, u) => s + (u.activity_score || 0), 0) / liveUsers.length) : null;

  return (
    <>
    <div
      className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-start hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setShowDrilldown(true)}
    >
      {/* Gauge */}
      <HealthGauge score={hasLive ? (avgScore ?? score) : score} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm truncate">{tool.tool_name}</p>
            {tool.category && <p className="text-xs text-muted-foreground">{tool.category}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasLive ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● Live</span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">~ Est.</span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.cls}`}>
              <StatusIcon className="w-2.5 h-2.5" />
              {meta.label}
            </span>
          </div>
        </div>

        {/* Live user breakdown */}
        {hasLive && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">{activeCount} active</span>
              {dormantCount > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">{dormantCount} dormant</span>}
              {inactiveCount > 0 && <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">{inactiveCount} inactive</span>}
              <span className="text-[10px] text-muted-foreground px-1 py-0.5">{liveUsers.length} users tracked</span>
            </div>
            <MetricBar value={avgDays} max={30} label="Avg active days / 30" unit="d" />
            <MetricBar value={avgScore} max={100} label="Avg activity score" unit="" />
          </div>
        )}

        {/* Estimated metrics row (only when no live data) */}
        {!hasLive && (
          <div className="mt-2.5 flex flex-wrap gap-3">
            {utilRate !== null && (
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Utilization</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${utilRate >= 70 ? "bg-emerald-500" : utilRate >= 40 ? "bg-amber-400" : "bg-destructive"}`}
                      style={{ width: `${utilRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">{utilRate}%</span>
                </div>
              </div>
            )}
            {tool.license_cost_per_month != null && (
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seat Cost</p>
                <p className="text-xs font-semibold mt-0.5 font-mono">${tool.license_cost_per_month}/mo</p>
              </div>
            )}
            {tool.days_active_last_30 != null && (
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Days (30d)</p>
                <p className="text-xs font-semibold mt-0.5">{tool.days_active_last_30} / 30</p>
              </div>
            )}
          </div>
        )}

        {wastedCost && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <DollarSign className="w-3 h-3" />
            <span>~${Math.round(wastedCost)}/mo potentially wasted</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>Click to see per-user activity</span>
        </div>
      </div>
    </div>
    {showDrilldown && (
      <UserActivityDrilldown toolName={tool.tool_name} onClose={() => setShowDrilldown(false)} />
    )}
    </>
  );
}