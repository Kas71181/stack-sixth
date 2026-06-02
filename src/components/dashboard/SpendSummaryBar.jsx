import { DollarSign, TrendingDown, Package, Users } from "lucide-react";

function Metric({ icon: Icon, label, value, highlight, sub }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${highlight ? "bg-primary/5 border-primary/20" : "bg-card border-border/60"}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${highlight ? "bg-primary/10" : "bg-muted"}`}>
        <Icon className={`w-4.5 h-4.5 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div>
        <p className={`text-xl font-extrabold leading-tight ${highlight ? "text-primary" : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

export default function SpendSummaryBar({ audits, recommendations }) {
  const totalSpend = audits.reduce((s, a) => s + (a.monthly_budget || 0), 0);
  const totalSavings = (recommendations || [])
    .filter((r) => r.status === "Open")
    .reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);
  const totalTools = audits.reduce((s, a) => s + (a.existing_software?.length || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Metric icon={DollarSign} label="Monthly Spend" value={`$${totalSpend.toLocaleString()}`} />
      <Metric icon={TrendingDown} label="Savings Identified" value={`$${totalSavings.toLocaleString()}/mo`} highlight />
      <Metric icon={Package} label="Tools Tracked" value={totalTools} />
      <Metric icon={Users} label="Audits Run" value={audits.length} />
    </div>
  );
}