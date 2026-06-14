import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Activity, Plug, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ToolUsageCard from "@/components/usage/ToolUsageCard";
import UsageInsightsBar from "@/components/usage/UsageInsightsBar";

export default function UsageAnalytics({ syncKey = 0 }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState("All");

  const { data: activities = [], isLoading, refetch } = useQuery({
    queryKey: ["user-activity", user?.id],
    queryFn: () => base44.entities.UserActivity.list(),
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts-usage", user?.id],
    queryFn: () => base44.entities.Contract.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  // ── Build per-tool display records ──────────────────────────────────────────
  const liveUsersMap = {};
  const estimatedMap = {};

  activities.forEach((a) => {
    if (a.source === "live" && a.user_email !== "aggregate@placeholder") {
      if (!liveUsersMap[a.tool_name]) liveUsersMap[a.tool_name] = [];
      liveUsersMap[a.tool_name].push(a);
    } else {
      if (!estimatedMap[a.tool_name]) estimatedMap[a.tool_name] = a;
    }
  });

  const toolMap = {};
  Object.keys(liveUsersMap).forEach((toolName) => {
    const users = liveUsersMap[toolName];
    const avg = (key) => Math.round(users.reduce((s, u) => s + (u[key] || 0), 0) / users.length);
    const activeCount = users.filter((u) => u.status === "Active").length;
    const score = avg("activity_score");
    toolMap[toolName] = {
      tool_name: toolName,
      source: "live",
      activity_score: score,
      days_active_last_30: avg("days_active_last_30"),
      status: activeCount / users.length >= 0.7 ? "Active" : activeCount / users.length >= 0.3 ? "Dormant" : "Inactive",
      wasted_cost_flag: score < 40,
      license_cost_per_month: users[0]?.license_cost_per_month || 0,
      liveUsers: users,
    };
  });
  Object.keys(estimatedMap).forEach((toolName) => {
    if (!toolMap[toolName]) toolMap[toolName] = { ...estimatedMap[toolName], liveUsers: [] };
  });
  integrations.forEach((i) => {
    if (toolMap[i.tool_name]) {
      toolMap[i.tool_name].category = i.category;
      toolMap[i.tool_name].licensed_seats = i.licensed_seats;
      toolMap[i.tool_name].active_users = i.active_users;
    }
  });

  const tools = Object.values(toolMap);

  // ── Enrich with CPAU + utilRate ──────────────────────────────────────────────
  const enrichedTools = tools.map((t) => {
    const activeCount = t.liveUsers?.length > 0
      ? t.liveUsers.filter((u) => u.status === "Active").length
      : t.active_users || 0;
    const totalCost = t.licensed_seats > 0
      ? t.license_cost_per_month * t.licensed_seats
      : t.license_cost_per_month || 0;
    const cpau = activeCount > 0 && totalCost > 0 ? Math.round(totalCost / activeCount) : null;
    const utilRate = t.licensed_seats > 0
      ? Math.round((activeCount / t.licensed_seats) * 100)
      : null;
    return { ...t, cpau, utilRate };
  });

  // ── Coverage stats ───────────────────────────────────────────────────────────
  const liveToolNames = new Set(Object.keys(liveUsersMap));
  const totalToolCount = enrichedTools.length;
  const liveToolCount = enrichedTools.filter((t) => t.source === "live").length;
  const estToolCount = totalToolCount - liveToolCount;
  const coveragePct = totalToolCount > 0 ? Math.round((liveToolCount / totalToolCount) * 100) : 0;
  const coverageColor = coveragePct >= 80 ? "bg-emerald-500" : coveragePct >= 50 ? "bg-amber-400" : "bg-primary";

  // ── Summary stats ────────────────────────────────────────────────────────────
  const wasted = enrichedTools.filter((t) => t.wasted_cost_flag);
  const totalWaste = wasted.reduce((s, t) => {
    const seats = t.licensed_seats > 0 ? t.licensed_seats : 1;
    return s + (t.license_cost_per_month || 0) * seats;
  }, 0);
  const avgScore = tools.length ? Math.round(tools.reduce((s, t) => s + (t.activity_score || 0), 0) / tools.length) : 0;
  const healthyCount = tools.filter((t) => t.status === "Active").length;

  // ── Filtering ────────────────────────────────────────────────────────────────
  const FILTERS = ["All", "Healthy", "At Risk", "Wasted"];
  const statusMap = { Healthy: "Active", "At Risk": "Dormant", Wasted: "Inactive" };

  const filtered = filter === "All"
    ? enrichedTools
    : enrichedTools.filter((t) => {
        if (filter === "Wasted") return t.status === "Inactive" || t.status === "Never Logged In";
        return t.status === statusMap[filter];
      });

  // ── Sync from stack ──────────────────────────────────────────────────────────
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
      await qc.invalidateQueries({ queryKey: ["user-activity"] });
      toast.success(`Synced ${toCreate.length} tool(s) from your stack.`);
    }
    setSyncing(false);
  };

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

      {/* ── Consolidated Coverage + Stats row ─────────────────────────────── */}
      {totalToolCount > 0 && (
        <div className="glass-card p-4 space-y-3">
          {/* Coverage bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Live Data Coverage</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    coveragePct >= 80 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40"
                    : coveragePct >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {coveragePct}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {liveToolCount} live
                  </span>
                  {estToolCount > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      {estToolCount} estimated
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${coverageColor}`}
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
            </div>
            {coveragePct < 80 && (
              <Link to="/data-coverage" className="flex-shrink-0">
                <Button size="sm" variant="outline" className="gap-1 text-xs border-primary/30 text-primary hover:bg-primary/5 h-7 px-2.5">
                  <Zap className="w-3 h-3" /> Improve <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            )}
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
            <div className="text-center">
              <p className="text-xl font-extrabold text-primary tabular-nums">{avgScore}</p>
              <p className="text-[10px] text-muted-foreground">Avg Health Score</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-emerald-600 tabular-nums">{healthyCount}/{tools.length}</p>
              <p className="text-[10px] text-muted-foreground">Tools Healthy</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-destructive tabular-nums">${Math.round(totalWaste).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Wasted / Month</p>
            </div>
          </div>
        </div>
      )}

      {/* Derived insights row */}
      {enrichedTools.length > 0 && (
        <UsageInsightsBar tools={enrichedTools} contracts={contracts} />
      )}

      {/* Waste callout */}
      {wasted.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            <strong>{wasted.length} tool{wasted.length > 1 ? "s" : ""}</strong> with low adoption — flagged for your next monitoring report.
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
                  ? enrichedTools.filter((t) => t.status === "Inactive" || t.status === "Never Logged In").length
                  : enrichedTools.filter((t) => t.status === statusMap[f]).length})
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