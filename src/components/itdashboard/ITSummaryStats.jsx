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
      accent: "hsl(220 9% 46%)",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
    {
      label: "Awaiting Review",
      value: pending,
      icon: Clock,
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-500",
      valueColor: "text-amber-500",
      glowColor: "rgba(245,158,11,0.08)",
      borderColor: "rgba(245,158,11,0.18)",
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      valueColor: "text-emerald-500",
      glowColor: "rgba(16,185,129,0.08)",
      borderColor: "rgba(16,185,129,0.18)",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-500",
      valueColor: "text-red-500",
      glowColor: "rgba(239,68,68,0.08)",
      borderColor: "rgba(239,68,68,0.18)",
    },
    {
      label: "Approved Savings/mo",
      value: `$${totalSavings.toLocaleString()}`,
      icon: TrendingDown,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      valueColor: "text-primary",
      glowColor: "hsl(var(--primary) / 0.08)",
      borderColor: "hsl(var(--primary) / 0.20)",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="glass-card hover-lift rounded-2xl p-4"
          style={s.borderColor ? {
            borderColor: s.borderColor,
            background: s.glowColor
              ? `color-mix(in srgb, var(--glass-bg) 85%, ${s.glowColor})`
              : undefined,
          } : {}}
        >
          <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
            <s.icon className={`w-4 h-4 ${s.iconColor}`} />
          </div>
          <p className={`text-2xl font-extrabold font-mono tabular-nums ${s.valueColor || "text-foreground"}`}>
            {s.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-tight font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}