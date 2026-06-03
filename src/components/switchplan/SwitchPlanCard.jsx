import { ArrowRight, Calendar, Users, DollarSign, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  Planning: "bg-blue-50 text-blue-700 border-blue-200",
  "Parallel Run": "bg-yellow-50 text-yellow-700 border-yellow-200",
  Cutover: "bg-orange-50 text-orange-700 border-orange-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function SwitchPlanCard({ plan, onClick }) {
  const savings = (plan.monthly_cost_old || 0) - (plan.monthly_cost_new || 0);
  const completed = (plan.checklist || []).filter((c) => c.completed).length;
  const total = (plan.checklist || []).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      onClick={() => onClick(plan)}
      className="bg-card border border-border/60 rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <span>{plan.from_tool}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span>{plan.to_tool}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[plan.status] || STATUS_COLORS.Planning}`}>
          {plan.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{completed}/{total} steps done</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {savings !== 0 && (
          <span className={`flex items-center gap-1 font-medium ${savings > 0 ? "text-emerald-600" : "text-red-500"}`}>
            <DollarSign className="w-3 h-3" />
            {savings > 0 ? `$${savings}/mo savings` : `$${Math.abs(savings)}/mo more`}
          </span>
        )}
        {plan.affected_users && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {plan.affected_users} users
          </span>
        )}
        {plan.cutover_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Cutover {plan.cutover_date}
          </span>
        )}
        {plan.reason && <span className="text-muted-foreground">{plan.reason}</span>}
      </div>
    </div>
  );
}