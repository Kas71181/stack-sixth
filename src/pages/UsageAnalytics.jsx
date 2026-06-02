import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Activity, TrendingDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

  // Aggregate to tool-level (deduplicate, prefer live data)
  const toolMap = {};
  activities.forEach((a) => {
    const key = a.tool_name;
    if (!toolMap[key] || a.source === "live") {
      toolMap[key] = { ...a };
    }
    // merge category from integrations
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