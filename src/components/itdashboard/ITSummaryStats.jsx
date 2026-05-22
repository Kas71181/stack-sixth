import { CheckCircle2, XCircle, Clock, TrendingDown, Layers } from "lucide-react";

export default function ITSummaryStats({ total, pending, approved, rejected, tools }) {
  const totalSavings = tools
    .filter((t) => t._decision === "approve")
    .reduce((sum, t) => sum + (t.estimated_savings_opportunity || 0), 0);

  const stats = [
    {
      label: "Total Tools",
      value: total,
      icon: Layers,
      color: "text-slate-500",
      iconBg: "bg-slate-100",
      border: "border-slate-200",
      bg: "bg-white",
    },
    {
      label: "Awaiting Review",
      value: pending,
      icon: Clock,
      color: "text-amber-600",
      iconBg: "bg-amber-100",
      border: "border-amber-200",
      bg: "bg-amber-50/50",
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle2,
      color: "text-emerald-600",
      iconBg: "bg-emerald-100",
      border: "border-emerald-200",
      bg: "bg-emerald-50/50",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "text-red-500",
      iconBg: "bg-red-100",
      border: "border-red-200",
      bg: "bg-red-50/50",
    },
    {
      label: "Approved Savings/mo",
      value: `$${totalSavings.toLocaleString()}`,
      icon: TrendingDown,
      color: "text-primary",
      iconBg: "bg-primary/10",
      border: "border-primary/20",
      bg: "bg-primary/5",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-2xl p-4 border shadow-sm ${s.bg} ${s.border} transition-all hover:shadow-md`}
        >
          <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center mb-3`}>
            <s.icon className={`w-4 h-4 ${s.color}`} />
          </div>
          <p className={`text-2xl font-bold ${s.highlight ? "text-primary" : "text-foreground"}`}>
            {s.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}