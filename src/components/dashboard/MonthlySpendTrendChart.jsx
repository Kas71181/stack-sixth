import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import moment from "moment";

function fmt(v) {
  return `$${v.toLocaleString()}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-primary font-mono">{fmt(payload[0].value)}</p>
    </div>
  );
};

export default function MonthlySpendTrendChart({ audits }) {
  const data = useMemo(() => {
    // Build last 6 months labels
    const months = Array.from({ length: 6 }, (_, i) =>
      moment().subtract(5 - i, "months")
    );

    return months.map((m) => {
      // Find all audits created in or before this month
      const relevantAudits = audits.filter((a) =>
        moment(a.created_date).isSameOrBefore(m, "month")
      );

      // Sum existing_software costs from the most recent audit per company
      const byCompany = {};
      relevantAudits.forEach((a) => {
        const key = a.company_name;
        if (!byCompany[key] || moment(a.created_date).isAfter(byCompany[key].created_date)) {
          byCompany[key] = a;
        }
      });

      const total = Object.values(byCompany).reduce((sum, a) => {
        return sum + (a.existing_software || []).reduce((s, sw) => s + (sw.monthly_cost || 0), 0);
      }, 0);

      return { month: m.format("MMM 'YY"), total };
    });
  }, [audits]);

  const first = data.find((d) => d.total > 0)?.total || 0;
  const last = data[data.length - 1]?.total || 0;
  const delta = last - first;
  const pct = first > 0 ? Math.abs(Math.round((delta / first) * 100)) : 0;
  const improving = delta <= 0;

  const hasData = data.some((d) => d.total > 0);

  if (!hasData) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold">Monthly Software Spend Trend</h3>
        {first > 0 && (
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${improving ? "text-emerald-600" : "text-destructive"}`}>
            {improving ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {improving ? `-${pct}%` : `+${pct}%`} vs 6mo ago
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-5">Total existing software spend tracked across your audits</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#spendGrad)"
            dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}