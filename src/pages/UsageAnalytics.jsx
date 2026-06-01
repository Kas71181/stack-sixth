import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { AlertTriangle, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import LiveConnectPanel from "@/components/usage/LiveConnectPanel";

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Dormant: "bg-amber-50 text-amber-700 border-amber-200",
  Inactive: "bg-red-50 text-red-700 border-red-200",
  "Never Logged In": "bg-red-100 text-red-800 border-red-300",
};

export default function UsageAnalytics() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toolFilter, setToolFilter] = useState("All");
  const [selected, setSelected] = useState([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["user-activity", user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserActivity.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-activity", user?.id] }),
  });

  const [syncing, setSyncing] = useState(false);
  const handleSyncFromStack = async () => {
    if (!integrations.length) return toast.error("No tools found in your stack.");
    setSyncing(true);
    try {
      const existingToolNames = new Set(users.map((u) => u.tool_name));
      const toCreate = integrations
        .filter((i) => !existingToolNames.has(i.tool_name))
        .map((i) => {
          const costPerSeat = i.licensed_seats > 0 ? (i.monthly_cost || 0) / i.licensed_seats : 0;
          const utilRate = i.licensed_seats > 0 ? (i.active_users || 0) / i.licensed_seats : 0;
          const activityScore = Math.round(utilRate * 100);
          const status = activityScore >= 70 ? "Active" : activityScore >= 30 ? "Dormant" : "Inactive";
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
    } finally {
      setSyncing(false);
    }
  };

  const toolNames = ["All", ...Array.from(new Set(users.map((u) => u.tool_name)))];
  const filtered = users.filter((u) => {
    const matchSearch = u.user_name?.toLowerCase().includes(search.toLowerCase()) || u.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    const matchTool = toolFilter === "All" || u.tool_name === toolFilter;
    return matchSearch && matchStatus && matchTool;
  });

  const wastedUsers = users.filter((u) => u.wasted_cost_flag);
  const totalWaste = wastedUsers.reduce((s, u) => s + (u.license_cost_per_month || 0), 0);

  const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleBulkAction = (action) => {
    selected.forEach((id) => {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      if (action === "flag") updateMutation.mutate({ id, data: { status: u.status } });
    });
    setSelected([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Usage Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSyncFromStack} disabled={syncing}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Stack"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="w-3.5 h-3.5" />Export CSV</Button>
        </div>
      </div>

      {/* Live Connectors */}
      <LiveConnectPanel onSynced={() => qc.invalidateQueries({ queryKey: ["user-activity", user?.id] })} />

      {/* Waste callout */}
      {wastedUsers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">{wastedUsers.length} inactive seats detected</p>
            <p className="text-sm text-amber-700">Estimated monthly waste: <strong>${Math.round(totalWaste).toLocaleString()}</strong></p>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="h-9 w-48" />
        <select value={toolFilter} onChange={(e) => setToolFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          {toolNames.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
          {["All", "Active", "Dormant", "Inactive", "Never Logged In"].map((s) => <option key={s}>{s}</option>)}
        </select>
        {selected.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleBulkAction("flag")}>Flag {selected.length} for Review</Button>
            <Button size="sm" variant="outline" onClick={() => setSelected([])}>Clear</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border/60">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? filtered.map((u) => u.id) : [])} /></th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Tool</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Last Active</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Days Active (30d)</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Seat Cost</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">Source</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" className="text-center py-12 text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-muted-foreground">No data yet — click <strong>Sync from Stack</strong> to auto-populate from your tools.</td></tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id} className={`border-b border-border/40 hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} /></td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.user_name}</p>
                      <p className="text-xs text-muted-foreground">{u.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{u.tool_name}</td>
                    <td className="px-4 py-3 text-xs">{u.last_active_date || "—"}</td>
                    <td className="px-4 py-3 text-xs">{u.days_active_last_30 ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${u.activity_score || 0}%` }} />
                        </div>
                        <span className="text-xs">{u.activity_score ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{u.license_cost_per_month ? `$${u.license_cost_per_month}` : "—"}</td>
                    <td className="px-4 py-3">
                     <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[u.status] || "bg-muted text-muted-foreground"}`}>{u.status}</span>
                    </td>
                    <td className="px-4 py-3">
                     {u.source === 'live'
                       ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● Live</span>
                       : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">Estimated</span>
                     }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}