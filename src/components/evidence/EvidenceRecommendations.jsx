import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AuditRecommendationCard from "@/components/savings/AuditRecommendationCard";

export default function EvidenceRecommendations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savingIndex, setSavingIndex] = useState(null);
  const { data: audit, isLoading } = useQuery({
    queryKey: ["latest-audit-recommendations", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await base44.entities.SoftwareAudit.filter({ created_by_id: user.id, status: "completed" }, "-created_date", 1))[0] || null,
  });
  const recommendations = audit?.analysis_result?.recommendations || [];
  const decide = async (index, decision) => {
    setSavingIndex(index);
    const updated = recommendations.map((rec, i) => i === index ? { ...rec, decision_state: decision, decision_at: new Date().toISOString() } : rec);
    await base44.entities.SoftwareAudit.update(audit.id, { analysis_result: { ...audit.analysis_result, recommendations: updated } });
    await queryClient.invalidateQueries({ queryKey: ["latest-audit-recommendations", user.id] });
    setSavingIndex(null);
  };
  if (isLoading) return <div className="skeleton h-32 rounded-2xl" />;
  if (!recommendations.length) return <div className="glass-card p-8 text-center"><p className="font-semibold">No tool recommendations yet</p><p className="mt-1 text-sm text-muted-foreground">Run an audit using your tools, processes, purposes, and pricing to generate alternatives.</p><Link to="/audit" className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.96]">Run an audit</Link></div>;
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">Based on the latest audit of your tools, their purposes, your processes, and pricing.</p>{recommendations.map((rec, index) => <AuditRecommendationCard key={`${rec.name}-${index}`} recommendation={rec} index={index} saving={savingIndex === index} onDecision={decide} />)}</div>;
}