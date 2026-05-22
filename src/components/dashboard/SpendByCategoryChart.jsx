import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Layers } from "lucide-react";

const COLORS = [
  "hsl(217 89% 40%)",
  "hsl(199 89% 48%)",
  "hsl(262 52% 47%)",
  "hsl(43 74% 55%)",
  "hsl(27 87% 60%)",
  "hsl(142 71% 40%)",
  "hsl(0 84% 60%)",
  "hsl(220 9% 55%)",
];

function formatCurrency(val) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${Math.round(val)}`;
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">{d.category}</p>
      <p className="text-muted-foreground">{d.count} tool{d.count !== 1 ? "s" : ""}</p>
      <p className="font-mono font-bold text-primary">{formatCurrency(d.spend)}/mo</p>
      {d.savings > 0 && (
        <p className="text-emerald-600 text-xs mt-1">Save ~{formatCurrency(d.savings)}/mo</p>
      )}
    </div>
  );
};

export default function SpendByCategoryChart({ audits }) {
  const { data, totalSpend } = useMemo(() => {
    const categoryMap = {};

    audits.forEach((audit) => {
      const existing = audit.existing_software || [];
      const recs = audit.analysis_result?.recommendations || [];

      // Tally existing software spend by category
      existing.forEach((sw) => {
        const cat = sw.category || "Other";
        if (!categoryMap[cat]) categoryMap[cat] = { spend: 0, savings: 0, count: 0 };
        categoryMap[cat].spend += sw.monthly_cost || 0;
        categoryMap[cat].count += 1;
      });

      // Tally savings opportunities by category
      recs.forEach((rec) => {
        const cat = rec.category || "Other";
        if (!categoryMap[cat]) categoryMap[cat] = { spend: 0, savings: 0, count: 0 };
        categoryMap[cat].savings += rec.estimated_savings_opportunity || 0;
      });
    });

    const sorted = Object.entries(categoryMap)
      .map(([category, vals]) => ({ category, ...vals }))
      .filter((d) => d.spend > 0)
      .sort((a, b) => b.spend - a.spend);

    const total = sorted.reduce((s, d) => s + d.spend, 0);
    return { data: sorted, totalSpend: total };
  }, [audits]);

  if (!data.length) return null;

  // Find the highest-spend category
  const topCategory = data[0];

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Spend by Category</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total tracked spend</p>
            <p className="font-bold font-mono">{formatCurrency(totalSpend)}/mo</p>
          </div>
          {topCategory && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Highest category</p>
              <p className="font-semibold text-destructive">{topCategory.category}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={data.length > 5 ? -30 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={data.length > 5 ? 50 : 30}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220 14% 96%)" }} />
            <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Category breakdown pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {data.map((d, i) => (
            <div key={d.category} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-xs">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="font-medium">{d.category}</span>
              <span className="text-muted-foreground font-mono">{formatCurrency(d.spend)}/mo</span>
              {d.savings > 0 && (
                <span className="text-emerald-600 font-semibold">· save {formatCurrency(d.savings)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}