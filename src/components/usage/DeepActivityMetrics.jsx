import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MessageSquare, GitCommit, Video, BarChart2, TrendingUp } from "lucide-react";

const METRIC_CONFIG = {
  Slack: {
    icon: MessageSquare,
    color: "text-purple-600",
    bg: "bg-purple-50",
    metrics: [
      { key: "days_active_last_30", label: "Active days / 30", max: 30, unit: "d" },
      { key: "activity_score", label: "Activity score", max: 100, unit: "" },
    ],
  },
  GitHub: {
    icon: GitCommit,
    color: "text-slate-700",
    bg: "bg-slate-50",
    metrics: [
      { key: "days_active_last_30", label: "Events last 30d", max: 30, unit: "" },
      { key: "activity_score", label: "Commit score", max: 100, unit: "" },
    ],
  },
  Notion: {
    icon: BarChart2,
    color: "text-gray-700",
    bg: "bg-gray-50",
    metrics: [
      { key: "days_active_last_30", label: "Active days / 30", max: 30, unit: "d" },
      { key: "activity_score", label: "Activity score", max: 100, unit: "" },
    ],
  },
  Zoom: {
    icon: Video,
    color: "text-blue-600",
    bg: "bg-blue-50",
    metrics: [
      { key: "days_active_last_30", label: "Meeting days / 30", max: 30, unit: "d" },
      { key: "activity_score", label: "Meeting score", max: 100, unit: "" },
    ],
  },
};

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

export default function DeepActivityMetrics() {
  const { user } = useAuth();

  const { data: activities = [] } = useQuery({
    queryKey: ["user-activity", user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id, source: "live" }),
    enabled: !!user?.id,
  });

  // Group by tool, compute averages
  const toolGroups = {};
  activities.forEach((a) => {
    if (!toolGroups[a.tool_name]) toolGroups[a.tool_name] = [];
    toolGroups[a.tool_name].push(a);
  });

  const toolSummaries = Object.entries(toolGroups).map(([tool, users]) => {
    const avg = (key) => users.length ? Math.round(users.reduce((s, u) => s + (u[key] || 0), 0) / users.length) : 0;
    const activeCount = users.filter((u) => u.status === "Active").length;
    const dormantCount = users.filter((u) => u.status === "Dormant").length;
    const inactiveCount = users.filter((u) => u.status === "Inactive" || u.status === "Never Logged In").length;
    return {
      tool,
      users: users.length,
      activeCount,
      dormantCount,
      inactiveCount,
      avg_days_active: avg("days_active_last_30"),
      avg_activity_score: avg("activity_score"),
    };
  });

  if (toolSummaries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">Deep Activity Signals</h3>
        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Live</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {toolSummaries.map(({ tool, users, activeCount, dormantCount, inactiveCount, avg_days_active, avg_activity_score }) => {
          const config = METRIC_CONFIG[tool];
          const Icon = config?.icon || BarChart2;
          return (
            <div key={tool} className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${config?.bg || "bg-muted"} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${config?.color || "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-bold text-sm">{tool}</p>
                  <p className="text-[10px] text-muted-foreground">{users} users tracked</p>
                </div>
              </div>

              {/* User status breakdown */}
              <div className="flex gap-1.5">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  {activeCount} active
                </span>
                {dormantCount > 0 && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                    {dormantCount} dormant
                  </span>
                )}
                {inactiveCount > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                    {inactiveCount} inactive
                  </span>
                )}
              </div>

              {/* Metric bars */}
              <div className="space-y-2">
                <MetricBar value={avg_days_active} max={30} label="Avg active days / 30" unit="d" />
                <MetricBar value={avg_activity_score} max={100} label="Avg activity score" unit="" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}