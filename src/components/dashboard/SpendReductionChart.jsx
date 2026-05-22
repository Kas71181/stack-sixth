import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-primary font-bold">${payload[0]?.value?.toLocaleString()}/mo identified</p>
    </div>
  );
};

export default function SpendReductionChart({ audits }) {
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const monthAudits = audits.filter((a) => {
        const d = new Date(a.created_date);
        return d >= start && d <= end && a.status === "completed";
      });

      const savings = monthAudits.reduce((sum, a) => {
        return sum + (a.analysis_result?.recommendations || []).reduce(
          (s, r) => s + (r.estimated_savings_opportunity || 0), 0
        );
      }, 0);

      return {
        month: format(month, "MMM yy"),
        savings,
      };
    });
  }, [audits]);

  const totalIdentified = chartData.reduce((s, d) => s + d.savings, 0);
  const hasData = chartData.some((d) => d.savings > 0);

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingDown className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Spend Reduction Progress</h2>
            <p className="text-xs text-muted-foreground">Monthly savings identified — last 6 months</p>
          </div>
        </div>
        {totalIdentified > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Identified</p>
            <p className="text-lg font-extrabold text-primary">${totalIdentified.toLocaleString()}</p>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <p className="text-sm text-muted-foreground">No audit data in the last 6 months yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Complete an audit to start tracking your progress.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#savingsGrad)"
              dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}