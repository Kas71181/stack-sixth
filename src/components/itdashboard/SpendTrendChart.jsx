import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import moment from "moment";

function fmt(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm min-w-[140px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground text-xs">{p.name}</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{fmt(p.value)}/mo</span>
        </div>
      ))}
    </div>
  );
};

export default function SpendTrendChart({ audits }) {
  const { data, totalNow, totalBefore, hasData } = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) =>
      moment().subtract(5 - i, "months")
    );

    // For each month, pick the most recent audit per company created on or before that month
    const chartData = months.map((m) => {
      const byCompany = {};
      audits.forEach((a) => {
        if (!moment(a.created_date).isSameOrBefore(m, "month")) return;
        const key = a.company_name;
        if (!byCompany[key] || moment(a.created_date).isAfter(byCompany[key].created_date)) {
          byCompany[key] = a;
        }
      });

      const spend = Object.values(byCompany).reduce((sum, a) =>
        sum + (a.existing_software || []).reduce((s, sw) => s + (sw.monthly_cost || 0), 0), 0
      );

      // Savings identified = sum of estimated_savings_opportunity from recommendations
      const savings = Object.values(byCompany).reduce((sum, a) =>
        sum + (a.analysis_result?.recommendations || []).reduce(
          (s, r) => s + (r.estimated_savings_opportunity || 0), 0
        ), 0
      );

      return { month: m.format("MMM 'YY"), spend, savings };
    });

    const nonZero = chartData.filter((d) => d.spend > 0);
    return {
      data: chartData,
      hasData: nonZero.length > 0,
      totalNow: chartData[chartData.length - 1]?.spend || 0,
      totalBefore: nonZero[0]?.spend || 0,
    };
  }, [audits]);

  if (!hasData) return null;

  const delta = totalNow - totalBefore;
  const pct = totalBefore > 0 ? Math.abs(Math.round((delta / totalBefore) * 100)) : 0;
  const improving = delta <= 0;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Software Spend Over Time</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly cost across all tracked tools · last 6 months</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current Monthly Spend</p>
            <p className="text-xl font-bold font-mono text-foreground">{fmt(totalNow)}/mo</p>
          </div>
          {totalBefore > 0 && pct > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold ${
              improving
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-destructive/5 text-destructive border-destructive/20"
            }`}>
              {improving ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {improving ? `-${pct}%` : `+${pct}%`}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGradIT" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="savingsGradIT" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => fmt(v)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="spend"
            name="Total Spend"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#spendGradIT)"
            dot={{ r: 3.5, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            activeDot={{ r: 5.5, fill: "hsl(var(--primary))" }}
          />
          <Area
            type="monotone"
            dataKey="savings"
            name="Savings Identified"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="url(#savingsGradIT)"
            dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#10b981" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 justify-center">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-6 h-0.5 bg-primary rounded" />
          Total Spend
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-6 h-0.5 bg-emerald-500 rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg, #10b981 0, #10b981 4px, transparent 4px, transparent 8px)" }} />
          Savings Identified
        </div>
      </div>
    </div>
  );
}