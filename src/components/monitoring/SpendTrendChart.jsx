import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, parseISO } from "date-fns";

function formatCurrency(val) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${Math.round(val)}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm space-y-1">
      <p className="text-muted-foreground text-xs font-medium mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold font-mono">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function SpendTrendChart({ reports, audits }) {
  // Build month-over-month data from ToolMonitor reports
  const { chartData, trend, totalSaved } = useMemo(() => {
    if (!reports?.length) return { chartData: [], trend: 0, totalSaved: 0 };

    // Group reports by report_period, sum total_spend across all audits per period
    const byPeriod = {};
    reports.forEach((r) => {
      const period = r.report_period || format(parseISO(r.created_date), "yyyy-MM");
      if (!byPeriod[period]) byPeriod[period] = { spend: 0, savings: 0, flagged: 0, count: 0 };
      byPeriod[period].spend += r.total_spend || 0;
      byPeriod[period].savings += r.savings_identified || 0;
      byPeriod[period].flagged += r.flagged_tools || 0;
      byPeriod[period].count += 1;
    });

    // Also seed initial spend from audit data (month 0 baseline)
    const auditBaseline = audits?.reduce((sum, a) => {
      const softwareList = a.existing_software || [];
      return sum + softwareList.reduce((s, sw) => s + (sw.monthly_cost || 0), 0);
    }, 0) || 0;

    const sortedPeriods = Object.keys(byPeriod).sort();

    const data = sortedPeriods.map((period) => {
      const label = (() => {
        try {
          return format(parseISO(period + "-01"), "MMM yyyy");
        } catch {
          return period;
        }
      })();
      return {
        period: label,
        "Actual Spend": Math.round(byPeriod[period].spend),
        "Savings Found": Math.round(byPeriod[period].savings),
        "Flagged Tools": byPeriod[period].flagged,
      };
    });

    // If we have audit baseline, prepend it as "Baseline"
    if (auditBaseline > 0 && data.length > 0) {
      data.unshift({ period: "Baseline", "Actual Spend": Math.round(auditBaseline), "Savings Found": 0, "Flagged Tools": 0 });
    }

    const first = data[0]?.["Actual Spend"] || 0;
    const last = data[data.length - 1]?.["Actual Spend"] || 0;
    const trendPct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
    const saved = data.slice(1).reduce((s, d) => s + (d["Savings Found"] || 0), 0);

    return { chartData: data, trend: trendPct, totalSaved: saved };
  }, [reports, audits]);

  if (!chartData.length) return null;

  const TrendIcon = trend < 0 ? TrendingDown : trend > 0 ? TrendingUp : Minus;
  const trendColor = trend < 0 ? "text-emerald-600" : trend > 0 ? "text-destructive" : "text-muted-foreground";
  const trendBg = trend < 0 ? "bg-emerald-50 border-emerald-200" : trend > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted border-border";

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base">Spend Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Month-over-month software spend vs. savings identified</p>
        </div>
        <div className="flex items-center gap-3">
          {totalSaved > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total savings found</p>
              <p className="text-sm font-bold font-mono text-emerald-600">{formatCurrency(totalSaved)}/mo</p>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold ${trendBg} ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            {trend === 0 ? "Stable" : `${Math.abs(trend)}% ${trend < 0 ? "down" : "up"}`}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
              formatter={(value) => <span style={{ color: "hsl(220 9% 46%)" }}>{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="Actual Spend"
              stroke="hsl(217 89% 40%)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "hsl(217 89% 40%)" }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Savings Found"
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: "hsl(142 71% 45%)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}