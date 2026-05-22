import { CheckCircle2, XCircle, Clock, TrendingDown } from "lucide-react";

export default function ITSummaryStats({ total, pending, approved, rejected, tools }) {
  const totalSavings = tools
    .filter((t) => t._decision === "approve")
    .reduce((sum, t) => sum + (t.estimated_savings_opportunity || 0), 0);

  const stats = [
    {
      label: "Total Tools",
      value: total,
      icon: Clock,
      color: "text-muted-foreground",
      bg: "bg-muted/50",
    },
    {
      label: "Awaiting Decision",
      value: pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50 border-green-100",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50 border-red-100",
    },
    {
      label: "Approved Savings/mo",
      value: `$${totalSavings.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-primary",
      bg: "bg-primary/5 border-primary/10",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div key={s.label} className={`rounded-xl p-4 border ${s.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
          <p className={`text-xl font-bold font-mono ${s.highlight ? "text-primary" : ""}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}