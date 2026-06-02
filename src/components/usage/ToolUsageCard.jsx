import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";

function HealthGauge({ score }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
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

const STATUS_META = {
  Active:         { label: "Healthy",     cls: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle2 },
  Dormant:        { label: "At Risk",     cls: "text-amber-700 bg-amber-50 border-amber-200",       Icon: AlertTriangle },
  Inactive:       { label: "Wasted",      cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
  "Never Logged In": { label: "Wasted",  cls: "text-destructive bg-destructive/10 border-destructive/20", Icon: AlertTriangle },
};

export default function ToolUsageCard({ tool }) {
  const score = tool.activity_score ?? 0;
  const meta = STATUS_META[tool.status] || STATUS_META.Dormant;
  const StatusIcon = meta.Icon;

  const utilRate = tool.licensed_seats > 0
    ? Math.round(((tool.active_users || 0) / tool.licensed_seats) * 100)
    : null;

  const wastedCost = tool.wasted_cost_flag && tool.license_cost_per_month
    ? tool.license_cost_per_month
    : null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
      {/* Gauge */}
      <HealthGauge score={score} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm truncate">{tool.tool_name}</p>
            {tool.category && <p className="text-xs text-muted-foreground">{tool.category}</p>}
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 flex items-center gap-1 ${meta.cls}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {meta.label}
          </span>
        </div>

        {/* Metrics row */}
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

          {tool.source === "live" && (
            <div className="flex flex-col justify-end">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● Live</span>
            </div>
          )}
        </div>

        {wastedCost && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <DollarSign className="w-3 h-3" />
            <span>~${Math.round(wastedCost)}/mo potentially wasted</span>
          </div>
        )}
      </div>
    </div>
  );
}