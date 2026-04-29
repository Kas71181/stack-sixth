import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Sliders } from "lucide-react";
import { Slider } from "@/components/ui/slider";

function formatCurrency(val) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${Math.round(val)}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="text-muted-foreground mb-1">Month {label}</p>
      <p className="font-semibold text-primary">{formatCurrency(payload[0]?.value)}/mo saved</p>
      <p className="text-muted-foreground text-xs mt-0.5">
        Cumulative: {formatCurrency(payload[1]?.value)}
      </p>
    </div>
  );
};

export default function ROISimulator({ recommendations }) {
  const actionable = useMemo(
    () => recommendations?.filter((r) => (r.estimated_savings_opportunity || 0) > 0) || [],
    [recommendations]
  );

  const [adoptionRates, setAdoptionRates] = useState(() =>
    Object.fromEntries(actionable.map((r, i) => [i, 75]))
  );
  const [consolidation, setConsolidation] = useState(60);

  const monthlySavings = useMemo(() => {
    const fromRecs = actionable.reduce((sum, r, i) => {
      return sum + (r.estimated_savings_opportunity || 0) * ((adoptionRates[i] || 0) / 100);
    }, 0);
    const consolidationBonus = fromRecs * (consolidation / 100) * 0.15;
    return Math.round(fromRecs + consolidationBonus);
  }, [adoptionRates, consolidation, actionable]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const rampFactor = Math.min(1, (i + 1) / 3);
      const monthly = Math.round(monthlySavings * rampFactor);
      const cumulative = Array.from({ length: i + 1 }, (__, m) =>
        Math.round(monthlySavings * Math.min(1, (m + 1) / 3))
      ).reduce((a, b) => a + b, 0);
      return { month: i + 1, monthly, cumulative };
    });
  }, [monthlySavings]);

  const annualSavings = chartData[11]?.cumulative || 0;

  if (actionable.length === 0) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">ROI Simulator</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Projected annual savings</p>
          <p className="text-xl font-bold font-mono text-primary">{formatCurrency(annualSavings)}</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            <Sliders className="w-3.5 h-3.5" />
            Adjust Adoption Rates
          </div>

          {actionable.map((rec, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{rec.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Base: {formatCurrency(rec.estimated_savings_opportunity)}/mo
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary ml-3 w-10 text-right">
                  {adoptionRates[i]}%
                </span>
              </div>
              <Slider
                value={[adoptionRates[i]]}
                onValueChange={([val]) => setAdoptionRates((prev) => ({ ...prev, [i]: val }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          ))}

          <div className="pt-2 border-t border-border/40">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">License Consolidation</p>
                <p className="text-xs text-muted-foreground">Bonus savings from reducing overlap</p>
              </div>
              <span className="text-sm font-semibold text-primary ml-3 w-10 text-right">{consolidation}%</span>
            </div>
            <Slider
              value={[consolidation]}
              onValueChange={([val]) => setConsolidation(val)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Summary */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Monthly savings</span>
              <span className="font-semibold font-mono">{formatCurrency(monthlySavings)}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Break-even (est.)</span>
              <span className="font-semibold">
                {monthlySavings > 0 ? `Month ${Math.min(3, Math.ceil(500 / monthlySavings) || 1)}` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">
            12-Month Savings Projection
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(153 60% 38%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(153 60% 38%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis
                dataKey="month"
                tickFormatter={(v) => `M${v}`}
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
              <Area
                type="monotone"
                dataKey="monthly"
                stroke="hsl(199 89% 48%)"
                strokeWidth={2}
                fill="url(#colorMonthly)"
                dot={false}
                name="monthly"
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(153 60% 38%)"
                strokeWidth={2}
                fill="url(#colorCumulative)"
                dot={false}
                name="cumulative"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-2 justify-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-[hsl(199,89%,48%)] inline-block" />
              Monthly
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded bg-primary inline-block" />
              Cumulative
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}