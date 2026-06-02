import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingDown, ShieldCheck } from "lucide-react";
import RecommendationActions from "./RecommendationActions";
import { useAuth } from "@/lib/AuthContext";

const CAT_COLORS = {
  "Remove Tool": "bg-red-50 text-red-700 border-red-200",
  "Downgrade Plan": "bg-amber-50 text-amber-700 border-amber-200",
  "Reclaim Seats": "bg-orange-50 text-orange-700 border-orange-200",
  "Consolidate Tools": "bg-violet-50 text-violet-700 border-violet-200",
  "Negotiate Contract": "bg-blue-50 text-blue-700 border-blue-200",
  "Add Missing Tool": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS_USER = ["Open", "In Progress", "Pending Approval", "Dismissed"];
const STATUS_OPTIONS_ADMIN = ["Open", "In Progress", "Pending Approval", "Completed", "Dismissed"];

const STATUS_STYLES = {
  "Open": "text-slate-600",
  "In Progress": "text-blue-600",
  "Pending Approval": "text-amber-600 font-semibold",
  "Completed": "text-emerald-600",
  "Dismissed": "text-muted-foreground",
};

export default function RecommendationsList({ auditId }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();
  const { data: recs = [] } = useQuery({
    queryKey: ["recommendations", auditId],
    queryFn: () => base44.entities.Recommendation.filter({ audit_id: auditId }),
    enabled: !!auditId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Recommendation.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", auditId] }),
  });

  if (recs.length === 0) return null;

  const sorted = [...recs].sort((a, b) => (b.estimated_monthly_savings || 0) - (a.estimated_monthly_savings || 0));
  const totalSavings = sorted.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold flex items-center gap-2"><TrendingDown className="w-4 h-4 text-primary" />Recommendations</h2>
        <span className="text-sm font-semibold text-emerald-600">Save ${Math.round(totalSavings).toLocaleString()}/mo</span>
      </div>
      <div className="space-y-3">
        {sorted.map((rec) => (
          <div key={rec.id} className="border border-border/60 rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CAT_COLORS[rec.category] || "bg-muted text-muted-foreground"}`}>{rec.category}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[rec.priority] || ""}`}>{rec.priority}</span>
                <span className="font-semibold text-sm">{rec.tool_name}</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 font-mono">${rec.estimated_monthly_savings || 0}/mo</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={rec.status}
                onChange={(e) => updateMutation.mutate({ id: rec.id, status: e.target.value })}
                className={`h-8 rounded-lg border border-input bg-background px-3 text-xs ${STATUS_STYLES[rec.status] || ""}`}
              >
                {(isAdmin ? STATUS_OPTIONS_ADMIN : STATUS_OPTIONS_USER).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {rec.status === "Pending Approval" && isAdmin && (
                <button
                  onClick={() => updateMutation.mutate({ id: rec.id, status: "Completed" })}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Approve & Complete
                </button>
              )}
              {rec.status === "Pending Approval" && !isAdmin && (
                <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Awaiting admin approval
                </span>
              )}
            </div>
            <RecommendationActions rec={rec} auditId={auditId} />
          </div>
        ))}
      </div>
    </div>
  );
}