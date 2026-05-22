import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calculator, TrendingUp, Users, DollarSign } from "lucide-react";
import { Slider } from "@/components/ui/slider";

function formatCurrency(val) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${Math.round(val)}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg text-sm space-y-1">
      <p className="text-muted-foreground font-medium">Year {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ProjectedROICalculator({ recommendations, currentBudget, teamSize }) {
  const baseMonthlySavings = useMemo(() =>
    (recommendations || []).reduce((s, r) => s + (r.estimated_savings_opportunity || 0), 0),
    [recommendations]
  );

  const [teamGrowthRate, setTeamGrowthRate] = useState(20);   // % per year
  const [budgetGrowthRate, setBudgetGrowthRate] = useState(15); // % per year
  const [implementationCost, setImplementationCost] = useState(500); // one-time $
  const [years, setYears] = useState(3);

  const projectionData = useMemo(() => {
    return Array.from({ length: years }, (_, yi) => {
      const year = yi + 1;
      const growthMultiplier = Math.pow(1 + teamGrowthRate / 100, year);
      const budgetMultiplier = Math.pow(1 + budgetGrowthRate / 100, year);
      const projectedMonthlySavings = baseMonthlySavings * growthMultiplier;
      const projectedAnnualSavings = projectedMonthlySavings * 12;
      const projectedBudget = (currentBudget || 0) * budgetMultiplier * 12;
      const cumulativeSavings = Array.from({ length: year }, (__, y) => {
        const mult = Math.pow(1 + teamGrowthRate / 100, y + 1);
        return baseMonthlySavings * mult * 12;
      }).reduce((a, b) => a + b, 0) - implementationCost;

      return {
        year,
        annualSavings: Math.round(projectedAnnualSavings),
        cumulativeSavings: Math.round(cumulativeSavings),
        projectedBudget: Math.round(projectedBudget),
      };
    });
  }, [baseMonthlySavings, teamGrowthRate, budgetGrowthRate, implementationCost, years, currentBudget]);

  const totalCumulativeSavings = projectionData[projectionData.length - 1]?.cumulativeSavings || 0;
  const breakEvenYear = projectionData.find((d) => d.cumulativeSavings >= 0)?.year;

  if (baseMonthlySavings === 0) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Long-Term ROI Calculator</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{years}-year projected savings</p>
          <p className={`text-xl font-bold font-mono ${totalCumulativeSavings >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatCurrency(Math.abs(totalCumulativeSavings))}
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Growth Assumptions
          </p>

          {/* Team growth rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" /> Team Growth Rate
                </p>
                <p className="text-xs text-muted-foreground">Annual headcount increase</p>
              </div>
              <span className="text-sm font-semibold text-primary ml-3">{teamGrowthRate}%/yr</span>
            </div>
            <Slider value={[teamGrowthRate]} onValueChange={([v]) => setTeamGrowthRate(v)} min={0} max={100} step={5} className="w-full" />
          </div>

          {/* Budget growth rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Budget Growth Rate
                </p>
                <p className="text-xs text-muted-foreground">Expected annual budget increase</p>
              </div>
              <span className="text-sm font-semibold text-primary ml-3">{budgetGrowthRate}%/yr</span>
            </div>
            <Slider value={[budgetGrowthRate]} onValueChange={([v]) => setBudgetGrowthRate(v)} min={0} max={100} step={5} className="w-full" />
          </div>

          {/* Implementation cost */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Implementation Cost</p>
                <p className="text-xs text-muted-foreground">One-time migration & setup cost</p>
              </div>
              <span className="text-sm font-semibold text-primary ml-3">${implementationCost.toLocaleString()}</span>
            </div>
            <Slider value={[implementationCost]} onValueChange={([v]) => setImplementationCost(v)} min={0} max={10000} step={250} className="w-full" />
          </div>

          {/* Projection horizon */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Projection Horizon</p>
                <p className="text-xs text-muted-foreground">Number of years to project</p>
              </div>
              <span className="text-sm font-semibold text-primary ml-3">{years} years</span>
            </div>
            <Slider value={[years]} onValueChange={([v]) => setYears(v)} min={1} max={5} step={1} className="w-full" />
          </div>

          {/* Summary */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2 mt-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base monthly savings</span>
              <span className="font-semibold font-mono">{formatCurrency(baseMonthlySavings)}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Yr {years} monthly savings</span>
              <span className="font-semibold font-mono text-primary">
                {formatCurrency(projectionData[projectionData.length - 1]?.annualSavings / 12)}/mo
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-primary/10 pt-2">
              <span className="text-muted-foreground">Break-even</span>
              <span className="font-semibold">
                {implementationCost === 0 ? "Immediate" : breakEvenYear ? `Year ${breakEvenYear}` : "Beyond horizon"}
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">
            {years}-Year Savings Projection
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={projectionData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis
                dataKey="year"
                tickFormatter={(v) => `Yr ${v}`}
                tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }}
                axisLine={false}
                tickLine={false}
                width={58}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(220 9% 46%)" }} />
              <Line
                type="monotone"
                dataKey="annualSavings"
                name="Annual Savings"
                stroke="hsl(199 89% 48%)"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(199 89% 48%)" }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeSavings"
                name="Cumulative (net)"
                stroke="hsl(217 89% 40%)"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(217 89% 40%)" }}
                strokeDasharray="5 3"
              />
              {currentBudget > 0 && (
                <Line
                  type="monotone"
                  dataKey="projectedBudget"
                  name="Projected Budget"
                  stroke="hsl(43 74% 60%)"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 4"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}