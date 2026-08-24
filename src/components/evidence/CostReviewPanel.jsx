import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import useEvidenceAnalytics from "@/hooks/useEvidenceAnalytics";

export default function CostReviewPanel() {
  const { data } = useEvidenceAnalytics();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const conflicts = (data?.applications || []).filter((app) => app.cost.status === "needs_review");
  if (!conflicts.length) return null;
  const resolve = async (appId, recordId) => {
    setSaving(recordId); setError("");
    try { await base44.functions.invoke("resolveCostConflict", { organizationAppId: appId, financialRecordId: recordId }); await queryClient.invalidateQueries({ queryKey: ["evidence-analytics"] }); }
    catch { setError("The selected cost could not be saved. Please try again."); }
    finally { setSaving(""); }
  };
  return <div className="space-y-3"><h2 className="flex items-center gap-2 text-base font-bold"><AlertTriangle className="h-4 w-4 text-amber-600" />Costs needing review</h2>{conflicts.map((app) => <div key={app.id} className="glass-card p-5"><p className="font-semibold">{app.name}</p><p className="mt-1 text-sm text-muted-foreground">Sources disagree. Select the authoritative current monthly cost.</p><div className="mt-3 flex flex-wrap gap-2">{app.cost.alternatives.map((option) => <button key={option.id} disabled={!!saving} onClick={() => resolve(app.id, option.id)} className="rounded-xl border border-border bg-background px-3 py-2 text-left text-sm active:scale-[0.96] disabled:opacity-50"><strong>${Math.round(option.amount).toLocaleString()}/mo</strong><span className="ml-2 text-xs text-muted-foreground">{option.source}</span></button>)}</div></div>)}{error && <p className="text-sm text-destructive">{error}</p>}</div>;
}