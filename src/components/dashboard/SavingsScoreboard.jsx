import { TrendingDown, CheckCircle2, Clock, Zap } from "lucide-react";

export default function SavingsScoreboard({ recommendations, audits }) {
  const completed = (recommendations || []).filter((r) => r.status === "Completed");
  const open = (recommendations || []).filter((r) => r.status === "Open");
  const inProgress = (recommendations || []).filter((r) => r.status === "In Progress" || r.status === "Pending Approval");

  const savedPerMonth = completed.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);
  const savedAnnualized = savedPerMonth * 12;
  const potentialLeft = open.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);

  // Estimate months since first audit
  const firstAudit = audits?.slice(-1)[0];
  const monthsActive = firstAudit
    ? Math.max(1, Math.round((Date.now() - new Date(firstAudit.created_date).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 1;
  const totalSaved = savedPerMonth * monthsActive;

  if (completed.length === 0 && open.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <TrendingDown className="w-4 h-4 text-emerald-700" />
        </div>
        <div>
          <p className="font-bold text-sm text-emerald-900">Savings Scoreboard</p>
          <p className="text-xs text-emerald-700">Your stack optimization progress</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total saved (estimated lifetime) */}
        <div className="bg-white/70 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-2xl font-extrabold text-emerald-700">
            ${totalSaved >= 1000 ? `${(totalSaved / 1000).toFixed(1)}k` : totalSaved.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Est. Saved to Date</p>
        </div>

        {/* Monthly run-rate savings */}
        <div className="bg-white/70 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-2xl font-extrabold text-emerald-700">
            ${savedPerMonth >= 1000 ? `${(savedPerMonth / 1000).toFixed(1)}k` : savedPerMonth.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Saved / Month</p>
        </div>

        {/* Completed actions */}
        <div className="bg-white/70 rounded-xl p-3 text-center border border-emerald-100">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-2xl font-extrabold text-emerald-700">{completed.length}</p>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Actions Completed</p>
        </div>

        {/* Still available */}
        <div className="bg-white/70 rounded-xl p-3 text-center border border-emerald-100">
          <div className="flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <p className="text-2xl font-extrabold text-amber-700">
              ${potentialLeft >= 1000 ? `${(potentialLeft / 1000).toFixed(1)}k` : potentialLeft.toLocaleString()}
            </p>
          </div>
          <p className="text-[10px] text-amber-600 font-medium mt-0.5">Still Available / Mo</p>
        </div>
      </div>

      {inProgress.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
          <Clock className="w-3.5 h-3.5" />
          <span>{inProgress.length} action{inProgress.length > 1 ? "s" : ""} in progress. Keep going!</span>
        </div>
      )}
    </div>
  );
}