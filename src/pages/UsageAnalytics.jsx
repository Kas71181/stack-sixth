import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Activity, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ToolUsageCard from "@/components/usage/ToolUsageCard";

export default function UsageAnalytics() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("All");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["user-activity", user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  // Collect all live user records per tool name
  const liveUsersMap = {};
  activities.forEach((a) => {
    if (a.source === "live" && a.user_email !== "aggregate@placeholder") {
      if (!liveUsersMap[a.tool_name]) liveUsersMap[a.tool_name] = [];
      liveUsersMap[a.tool_name].push(a);
    }
  });

  // Build one entry per tool: prefer live summary, skip estimated if live exists
  const toolMap = {};
  activities.forEach((a) => {
    const key = a.tool_name;
    const hasLiveData = liveUsersMap[key]?.length > 0;
    // Skip estimated/placeholder records when live data exists for this tool
    if (a.user_email === "aggregate@placeholder" && hasLiveData) return;
    if (!toolMap[key] || a.source === "live") {
      toolMap[key] = { ...a, liveUsers: liveUsersMap[key] || [] };
    }
  });

  // For tools that only have live data, compute a representative summary record
  Object.keys(liveUsersMap).forEach((toolName) => {
    if (toolMap[toolName]) {
      const users = liveUsersMap[toolName];
      const avg = (key) => users.length ? Math.round(users.reduce((s, u) => s + (u[key] || 0), 0) / users.length) : 0;
      const activeCount = users.filter((u) => u.status === "Active").length;
      const score = avg("activity_score");
      toolMap[toolName].activity_score = score;
      toolMap[toolName].days_active_last_30 = avg("days_active_last_30");
      toolMap[toolName].status = activeCount / users.length >= 0.7 ? "Active" : activeCount / users.length >= 0.3 ? "Dormant" : "Inactive";
      toolMap[toolName].wasted_cost_flag = score < 40;
      toolMap[toolName].source = "live";
    }
  });

  integrations.forEach((i) => {
    if (toolMap[i.tool_name]) {
      toolMap[i.tool_name].category = i.category;
      toolMap[i.tool_name].licensed_seats = i.licensed_seats;
      toolMap[i.tool_name].active_users = i.active_users;
    }
  });
  const tools = Object.values(toolMap);

  const handleSyncFromStack = async () => {
    if (!integrations.length) return toast.error("No tools found in your stack.");
    setSyncing(true);
    const existingToolNames = new Set(activities.map((u) => u.tool_name));
    const toCreate = integrations
      .filter((i) => !existingToolNames.has(i.tool_name))
      .map((i) => {
        const utilRate = i.licensed_seats > 0 ? (i.active_users || 0) / i.licensed_seats : 0;
        const activityScore = Math.round(utilRate * 100);
        const status = activityScore >= 70 ? "Active" : activityScore >= 30 ? "Dormant" : "Inactive";
        const costPerSeat = i.licensed_seats > 0 ? (i.monthly_cost || 0) / i.licensed_seats : 0;
        return {
          integration_id: i.id,
          company_id: i.company_id || "",
          tool_name: i.tool_name,
          user_email: "aggregate@placeholder",
          user_name: `${i.tool_name} (aggregate)`,
          days_active_last_30: Math.round(utilRate * 22),
          activity_score: activityScore,
          status,
          license_cost_per_month: Math.round(costPerSeat * 100) / 100,
          wasted_cost_flag: activityScore < 40,
        };
      });
    if (!toCreate.length) {
      toast.info("All tools already have activity entries.");
    } else {
      await base44.entities.UserActivity.bulkCreate(toCreate);
      await qc.invalidateQueries({ queryKey: ["user-activity", user?.id] });
      toast.success(`Synced ${toCreate.length} tool(s) from your stack.`);
    }
    setSyncing(false);
  };

  const FILTERS = ["All", "Healthy", "At Risk", "Wasted"];
  const statusMap = { Healthy: "Active", "At Risk": "Dormant", Wasted: "Inactive" };

  const filtered = filter === "All"
    ? tools
    : tools.filter((t) => {
        if (filter === "Wasted") return t.status === "Inactive" || t.status === "Never Logged In";
        return t.status === statusMap[filter];
      });

  const wasted = tools.filter((t) => t.wasted_cost_flag);
  const totalWaste = wasted.reduce((s, t) => s + (t.license_cost_per_month || 0), 0);
  const avgScore = tools.length ? Math.round(tools.reduce((s, t) => s + (t.activity_score || 0), 0) / tools.length) : 0;
  const healthyCount = tools.filter((t) => t.status === "Active").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Usage Health</h1>
            <p className="text-xs text-muted-foreground">Tool-level adoption across your stack</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSyncFromStack} disabled={syncing}>
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync from Stack"}
        </Button>
      </div>

      {/* Summary stats */}
      {tools.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{avgScore}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg Health Score</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-600">{healthyCount}/{tools.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tools Healthy</p>
          </div>
          <div className="bg-card border border-border/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-destructive">${Math.round(totalWaste).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Wasted / Month</p>
          </div>
        </div>
      )}

      {/* Live data nudge */}
      {tools.length > 0 && tools.every((t) => t.source !== "live") && (
        <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">All data is estimated. Connect live sources to get real utilization.</p>
          </div>
          <Link to="/it-dashboard" state={{ tab: "integrations" }}>
            <Button size="sm" variant="outline" className="gap-1.5 flex-shrink-0">
              <Plug className="w-3.5 h-3.5" /> Connect Sources
            </Button>
          </Link>
        </div>
      )}

      {/* Waste callout */}
      {wasted.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{wasted.length} tool{wasted.length > 1 ? "s" : ""}</strong> with low adoption detected — these scores will be flagged in your next monitoring report.
          </p>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
            {f !== "All" && (
              <span className="ml-1.5 opacity-70">
                ({f === "Wasted"
                  ? tools.filter((t) => t.status === "Inactive" || t.status === "Never Logged In").length
                  : tools.filter((t) => t.status === statusMap[f]).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tool cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border/60 rounded-2xl">
          <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-sm">No usage data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click <strong>Sync from Stack</strong> to auto-populate from your tool stack.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((tool) => (
            <motion.div key={tool.id || tool.tool_name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <ToolUsageCard tool={tool} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}