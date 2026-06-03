import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Award } from "lucide-react";

export default function BenchmarkPanel({ integrations = [] }) {
  const { user } = useAuth();

  const { data: benchmarks = [] } = useQuery({
    queryKey: ["benchmarks"],
    queryFn: () => base44.entities.BenchmarkData.list("-sample_count", 50),
  });

  // Match user's tools against benchmark data
  const comparisons = integrations
    .filter((i) => i.monthly_cost > 0)
    .map((i) => {
      const bench = benchmarks.find((b) => b.tool_name?.toLowerCase() === i.tool_name?.toLowerCase());
      const userUtil = i.licensed_seats > 0 ? Math.round((i.active_users || 0) / i.licensed_seats * 100) : null;
      return {
        tool: i.tool_name,
        yourCost: i.monthly_cost || 0,
        benchCost: bench?.avg_monthly_cost || null,
        yourUtil: userUtil,
        benchUtil: bench ? Math.round((bench.avg_utilization_rate || 0) * 100) : null,
        sampleCount: bench?.sample_count || 0,
      };
    })
    .filter((c) => c.benchCost || c.benchUtil);

  const costOutliers = comparisons.filter((c) => c.benchCost && c.yourCost > c.benchCost * 1.2);

  if (benchmarks.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Stack Benchmarks</h3>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">BUILDING</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Benchmarks are built from anonymized audit data across all Stack Sixth customers.
          As more companies run audits, you'll see how your costs & utilization compare to similar-sized companies.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Avg SaaS overspend", value: "23%", icon: DollarSign },
            { label: "Unused seats typical", value: "31%", icon: Users },
            { label: "Tools with overlap", value: "2.4x", icon: Award },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-muted/40 rounded-xl p-3">
              <p className="text-lg font-extrabold text-primary">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">Based on industry research. Personalized benchmarks populate as your data grows.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">Stack Benchmarks</h3>
        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{benchmarks.length} tools</span>
      </div>

      {costOutliers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-800">
            {costOutliers.length} tool{costOutliers.length > 1 ? "s" : ""} where you're paying above benchmark:{" "}
            {costOutliers.map(c => c.tool).join(", ")}
          </p>
        </div>
      )}

      {comparisons.length > 0 && (
        <div className="space-y-3">
          {comparisons.slice(0, 5).map((c) => (
            <div key={c.tool} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">{c.tool}</p>
                {c.sampleCount > 0 && (
                  <p className="text-[10px] text-muted-foreground">{c.sampleCount} similar co's</p>
                )}
              </div>
              {c.benchCost && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground w-16">Cost/mo:</span>
                  <span className={`font-bold ${c.yourCost > c.benchCost * 1.2 ? "text-amber-600" : "text-emerald-600"}`}>
                    You: ${c.yourCost.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">vs benchmark ${c.benchCost.toLocaleString()}</span>
                </div>
              )}
              {c.benchUtil !== null && c.yourUtil !== null && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground w-16">Utilization:</span>
                  <span className={`font-bold ${c.yourUtil < c.benchUtil - 10 ? "text-red-500" : "text-emerald-600"}`}>
                    You: {c.yourUtil}%
                  </span>
                  <span className="text-muted-foreground">vs benchmark {c.benchUtil}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}