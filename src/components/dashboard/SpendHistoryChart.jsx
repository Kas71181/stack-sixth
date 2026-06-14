import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown, TrendingUp, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import moment from "moment";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm space-y-1">
      <p className="font-semibold">{label}</p>
      <p className="text-primary font-mono font-bold">${d.total.toLocaleString()}/mo</p>
      {d.wasted > 0 && <p className="text-destructive text-xs">~${d.wasted.toLocaleString()} wasted</p>}
      {d.savings > 0 && <p className="text-emerald-600 text-xs">+${d.savings.toLocaleString()} saved</p>}
      {d.tools > 0 && <p className="text-muted-foreground text-xs">{d.tools} tools tracked</p>}
      {d.isSnapshot && <p className="text-primary text-[10px] font-semibold">● Live snapshot</p>}
    </div>
  );
};

export default function SpendHistoryChart({ integrations = [], userActivity = [] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [snapshotting, setSnapshotting] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ["spend-history", user?.id],
    queryFn: () => base44.entities.SpendHistory.list("-period", 12),
    enabled: !!user?.id,
  });

  const takeSnapshot = async () => {
    setSnapshotting(true);
    const period = moment().format("YYYY-MM");
    const existing = history.find((h) => h.period === period);

    const totalSpend = integrations.reduce((s, i) => s + (i.monthly_cost || 0), 0);
    const activeUsers = integrations.reduce((s, i) => s + (i.active_users || 0), 0);
    const wastedTools = userActivity.filter((a) => a.wasted_cost_flag);
    const wastedSpend = wastedTools.reduce((s, a) => {
      const seats = a.licensed_seats > 0 ? a.licensed_seats : 1;
      return s + (a.license_cost_per_month || 0) * seats;
    }, 0);
    const snapshot = integrations.map((i) => ({
      tool_name: i.tool_name,
      category: i.category,
      monthly_cost: i.monthly_cost || 0,
      active_users: i.active_users || 0,
      licensed_seats: i.licensed_seats || 0,
    }));

    const data = { period, total_spend: totalSpend, tool_count: integrations.length, active_users: activeUsers, wasted_spend: Math.round(wastedSpend), snapshot };

    if (existing) {
      await base44.entities.SpendHistory.update(existing.id, data);
    } else {
      await base44.entities.SpendHistory.create(data);
    }
    await qc.invalidateQueries({ queryKey: ["spend-history"] });
    toast.success(`Snapshot saved for ${moment().format("MMMM YYYY")}`);
    setSnapshotting(false);
  };

  // Build chart data: last 12 months, fill from history
  const chartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => moment().subtract(11 - i, "months"));
    return months.map((m) => {
      const periodKey = m.format("YYYY-MM");
      const snap = history.find((h) => h.period === periodKey);
      return {
        month: m.format("MMM 'YY"),
        total: snap?.total_spend || 0,
        wasted: snap?.wasted_spend || 0,
        savings: snap?.savings_captured || 0,
        tools: snap?.tool_count || 0,
        isSnapshot: !!snap,
      };
    });
  }, [history]);

  const hasData = chartData.some((d) => d.total > 0);

  const nonZero = chartData.filter((d) => d.total > 0);
  const first = nonZero[0]?.total || 0;
  const last = nonZero[nonZero.length - 1]?.total || 0;
  const delta = last - first;
  const pct = first > 0 ? Math.abs(Math.round((delta / first) * 100)) : 0;
  const improving = delta <= 0 && first > 0;
  const snapshotCount = history.length;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight">Spend History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {snapshotCount} snapshot{snapshotCount !== 1 ? "s" : ""} recorded — your data moat grows over time
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {first > 0 && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${improving ? "text-emerald-600" : "text-destructive"}`}>
              {improving ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {improving ? `-${pct}%` : `+${pct}%`}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={takeSnapshot} disabled={snapshotting} className="gap-1.5 text-xs h-8">
            <BookmarkPlus className="w-3.5 h-3.5" />
            {snapshotting ? "Saving…" : "Snapshot Now"}
          </Button>
        </div>
      </div>

      {!hasData ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">No spend history yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Click <strong>Snapshot Now</strong> to record this month's spend. Do it monthly to build your trend.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendHistGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wastedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.12} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#spendHistGrad)" dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))" }} />
            <Area type="monotone" dataKey="wasted" stroke="hsl(var(--destructive))" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#wastedGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {hasData && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
          {[
            { label: "Peak Spend", value: `$${Math.max(...nonZero.map(d => d.total)).toLocaleString()}` },
            { label: "Avg / Month", value: `$${Math.round(nonZero.reduce((s, d) => s + d.total, 0) / nonZero.length).toLocaleString()}` },
            { label: "Snapshots", value: snapshotCount },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-sm font-extrabold tabular-nums font-mono">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}