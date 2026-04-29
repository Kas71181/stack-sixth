import { DollarSign, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";

const BUDGET_MAP = {
  within_budget: { label: "Within Budget", icon: CheckCircle2, color: "text-primary" },
  near_limit: { label: "Near Limit", icon: AlertTriangle, color: "text-yellow-600" },
  over_budget: { label: "Over Budget", icon: AlertTriangle, color: "text-destructive" },
  unknown: { label: "Unknown", icon: DollarSign, color: "text-muted-foreground" },
};

export default function BudgetSummary({ result, audit }) {
  const budgetInfo = BUDGET_MAP[result.budget_fit] || BUDGET_MAP.unknown;
  const BudgetIcon = budgetInfo.icon;

  const totalSavings = result.recommendations?.reduce(
    (sum, r) => sum + (r.estimated_savings_opportunity || 0),
    0
  ) || 0;

  const totalWaste = result.overlap_flags?.reduce(
    (sum, f) => sum + (f.estimated_monthly_waste || 0),
    0
  ) || 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-card border border-border/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Current Spend</span>
        </div>
        <p className="text-xl font-bold font-mono">
          ${(audit.existing_software?.reduce((s, t) => s + (t.monthly_cost || 0), 0) || 0).toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">/month</p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <BudgetIcon className={`w-4 h-4 ${budgetInfo.color}`} />
          <span className="text-xs text-muted-foreground">Budget Fit</span>
        </div>
        <p className={`text-sm font-semibold ${budgetInfo.color}`}>{budgetInfo.label}</p>
        {result.suggested_stack_total != null && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Suggested: ${result.suggested_stack_total.toLocaleString()}/mo
          </p>
        )}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Savings Potential</span>
        </div>
        <p className="text-xl font-bold font-mono text-primary">
          ${totalSavings.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">/month</p>
      </div>

      <div className={`rounded-xl p-4 border ${totalWaste > 0 ? "bg-destructive/5 border-destructive/20" : "bg-card border-border/60"}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={`w-4 h-4 ${totalWaste > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">Overlap Waste</span>
        </div>
        <p className={`text-xl font-bold font-mono ${totalWaste > 0 ? "text-destructive" : ""}`}>
          ${totalWaste.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">/month</p>
      </div>
    </div>
  );
}