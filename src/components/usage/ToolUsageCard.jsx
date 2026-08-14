import { useState } from "react";
import { AlertTriangle, CheckCircle2, DollarSign, Users, UserX } from "lucide-react";
import { calculateConfidence, getStaleness, STALENESS_STYLES } from "@/lib/confidenceScore";
import ToolLogo from "@/components/stack/ToolLogo";
import UserActivityDrilldown from "./UserActivityDrilldown";
import AccessVerifiedUsageCard from "./AccessVerifiedUsageCard";
import InsufficientEvidenceUsageCard from "./InsufficientEvidenceUsageCard";

function HealthGauge({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="w-16 flex-shrink-0 text-center">
      <div className="relative h-16 w-16 flex items-center justify-center">
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
      <span className="mt-1 block text-[9px] leading-tight text-muted-foreground">Usage out of 100</span>
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
  Active:            { label: "Regular use", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle2 },
  Dormant:           { label: "Low use", cls: "text-amber-700 bg-amber-50 border-amber-200", Icon: AlertTriangle },
  Inactive:          { label: "Not used", cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
  "Never Logged In": { label: "Never used", cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
};

export default function ToolUsageCard({ tool }) {
  const [showDrilldown, setShowDrilldown] = useState(false);
  const score = tool.activity_score ?? 0;
  const meta = STATUS_META[tool.status] || STATUS_META.Dormant;
  const StatusIcon = meta.Icon;

  // Use pre-computed values if available, else fallback to local calc
  const utilRate = tool.utilRate ?? (
    tool.licensed_seats > 0
      ? Math.round(((tool.active_users || 0) / tool.licensed_seats) * 100)
      : null
  );
  const cpau = tool.cpau ?? null;

  const totalCost = tool.licensed_seats > 0
    ? (tool.license_cost_per_month || 0) * tool.licensed_seats
    : tool.license_cost_per_month || 0;
  const wastedCost = tool.wasted_cost_flag && totalCost > 0 ? totalCost : null;

  // Live user breakdown
  const liveUsers = tool.liveUsers || [];
  // A tool is "live" if it has per-user live records OR if the record itself came from a live sync
  const hasLive = liveUsers.length > 0 || tool.source === "live";
  const activeCount = liveUsers.filter((u) => u.status === "Active").length;
  const dormantCount = liveUsers.filter((u) => u.status === "Dormant").length;
  const inactiveCount = liveUsers.filter((u) => u.status === "Inactive" || u.status === "Never Logged In").length;
  const avg = (key) => hasLive ? Math.round(liveUsers.reduce((s, u) => s + (u[key] || 0), 0) / liveUsers.length) : null;
  const avgDays = avg("days_active_last_30");
  const avgScore = avg("activity_score");

  // Deep signals (avg across live users, or from the tool record itself for single-user)
  const src = hasLive ? liveUsers : [tool];
  const sumSig = (key) => src.reduce((s, u) => s + (u[key] || 0), 0);
  const hasSignals = src.some((u) => u.logins_last_30 != null || u.transactions_last_30 != null || u.content_created_last_30 != null);
  const signals = hasSignals ? [
    { label: "sign-ins", value: sumSig("logins_last_30"), icon: "🔐" },
    { label: "actions", value: sumSig("transactions_last_30"), icon: "⚡" },
    { label: "items created", value: sumSig("content_created_last_30"), icon: "✏️" },
    { label: "features used", value: Math.max(...src.map((u) => u.features_used || 0)), icon: "🧩" },
    { label: "automated requests", value: sumSig("api_calls_last_30"), icon: "🔌" },
  ].filter((s) => s.value > 0) : [];

  // Data confidence + staleness
  const latestUpdate = liveUsers.length > 0
    ? liveUsers.reduce((latest, u) => {
        if (!u.updated_date) return latest;
        return !latest || new Date(u.updated_date) > new Date(latest) ? u.updated_date : latest;
      }, null)
    : tool.updated_date;
  const staleness = getStaleness(latestUpdate);
  const stalenessStyle = STALENESS_STYLES[staleness.level] || STALENESS_STYLES.unknown;
  const confidenceScore = calculateConfidence(tool, liveUsers);
  const offboardedCount = liveUsers.filter((u) => u.offboarded_flag).length;

  if (tool.source === "access") return <AccessVerifiedUsageCard tool={tool} />;
  if (tool.source !== "live") return <InsufficientEvidenceUsageCard tool={tool} />;

  return (
    <>
    <div
      className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-start hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setShowDrilldown(true)}
    >
      {/* Gauge */}
      <HealthGauge score={avgScore ?? score} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <ToolLogo name={tool.tool_name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{tool.tool_name}</p>
              {tool.category && <p className="text-xs text-muted-foreground">{tool.category}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasLive ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● Live</span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Not connected</span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${stalenessStyle.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stalenessStyle.dot}`} />
              {staleness.label}
            </span>
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
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">{activeCount} used recently</span>
              {dormantCount > 0 && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">{dormantCount} low use</span>}
              {inactiveCount > 0 && <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">{inactiveCount} no recent use</span>}
              <span className="text-[10px] text-muted-foreground px-1 py-0.5">{liveUsers.length} team members found</span>
            </div>
            <MetricBar value={avgDays} max={30} label="Average days used in the past 30" unit=" days" />
            <MetricBar value={avgScore} max={100} label="Average usage score (out of 100)" unit="" />
          </div>
        )}

        {/* Deep signal pills */}
        {signals.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {signals.map((s) => (
              <span key={s.label} className="text-[10px] bg-muted/60 border border-border/50 px-2 py-0.5 rounded-full text-foreground font-medium">
                {s.icon} {s.value.toLocaleString()} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Estimated active days (only when no live data) */}
        {!hasLive && tool.days_active_last_30 != null && (
          <div className="mt-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Estimated days used in the past 30</p>
            <p className="text-xs font-semibold mt-0.5">{tool.days_active_last_30} / 30</p>
          </div>
        )}

        {/* CPAU + Utilization metrics row */}
        {(cpau !== null || utilRate !== null) && (
          <div className="mt-2 flex flex-wrap gap-3">
            {cpau !== null && (
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly cost per active teammate</p>
                <p className={`text-xs font-bold mt-0.5 font-mono ${cpau > 100 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                  ${cpau.toLocaleString()}/mo
                </p>
              </div>
            )}
            {utilRate !== null && (
              <div className="flex flex-col">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Licensed seats in use</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${utilRate >= 70 ? "bg-emerald-500" : utilRate >= 40 ? "bg-amber-400" : "bg-destructive"}`}
                      style={{ width: `${utilRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold">{utilRate}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {offboardedCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-lg px-2 py-1">
            <UserX className="w-3 h-3 flex-shrink-0" />
            <span>{offboardedCount} offboarded user{offboardedCount > 1 ? "s" : ""} — seat likely reclaimable</span>
          </div>
        )}
        {wastedCost && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <DollarSign className="w-3 h-3" />
            <span>~${Math.round(wastedCost).toLocaleString()}/mo total spend at risk</span>
          </div>
        )}

        {confidenceScore < 70 && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>This tool's figures may be incomplete ({confidenceScore}% data reliability).</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>Open team member details</span>
        </div>
      </div>
    </div>
    {showDrilldown && (
      <UserActivityDrilldown toolName={tool.tool_name} onClose={() => setShowDrilldown(false)} />
    )}
    </>
  );
}