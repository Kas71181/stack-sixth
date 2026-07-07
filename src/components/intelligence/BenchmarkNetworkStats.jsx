import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Database, TrendingUp, Building2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function BenchmarkNetworkStats() {
  const { data: benchmarks = [], isLoading } = useQuery({
    queryKey: ["benchmark-network-stats"],
    queryFn: () => base44.entities.BenchmarkData.list("-sample_count", 200),
  });

  const totalSamples = benchmarks.reduce((sum, b) => sum + (b.sample_count || 0), 0);
  const toolsTracked = new Set(benchmarks.map((b) => b.tool_name?.toLowerCase().trim()).filter(Boolean)).size;
  const avgOverspend = benchmarks.length > 0
    ? Math.round(benchmarks.reduce((s, b) => s + (b.avg_monthly_cost || 0), 0) / benchmarks.length)
    : 0;

  const stats = [
    { label: "Data Points", value: totalSamples.toLocaleString(), icon: Database, color: "text-primary" },
    { label: "Tools Tracked", value: toolsTracked, icon: BarChart3, color: "text-chart-2" },
    { label: "Avg Cost/Mo", value: `$${avgOverspend}`, icon: TrendingUp, color: "text-chart-4" },
  ];

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="h-20 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Benchmark Network</h3>
          <p className="text-[11px] text-muted-foreground">Anonymized data from all Stack Sixth companies</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-subtle rounded-xl p-3 text-center"
          >
            <Icon className={`w-4 h-4 mx-auto mb-1.5 ${color}`} />
            <p className="text-lg font-extrabold">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        Every audit enriches the pool. Your data is anonymized and aggregated — no individual company's spend is ever exposed.
      </p>
    </div>
  );
}