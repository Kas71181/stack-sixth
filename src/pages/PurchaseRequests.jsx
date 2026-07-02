import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { ClipboardList, Plus, CheckCircle2, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import RequestForm from "@/components/purchasing/RequestForm";
import RequestCard from "@/components/purchasing/RequestCard";
import { toast } from "sonner";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function PurchaseRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState("inbox");
  const [evaluating, setEvaluating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["purchase-requests", user?.id],
    queryFn: () => base44.entities.PurchaseRequest.filter({ created_by_id: user?.id }, "-created_date", 100),
    enabled: !!user?.id,
  });

  const handleSubmit = async (formData) => {
    setEvaluating(true);
    try {
      const evalRes = await base44.functions.invoke("evaluatePurchaseRequest", formData);
      const evaluation = evalRes.data;

      const status = evaluation.ai_recommendation === "approve" ? "auto_approved" : "pending";

      await base44.entities.PurchaseRequest.create({
        ...formData,
        status,
        ai_recommendation: evaluation.ai_recommendation,
        decision_reason: evaluation.decision_reason,
        conflict_flags: evaluation.conflict_flags || [],
        redundancy_warnings: evaluation.redundancy_warnings || [],
        budget_impact_pct: evaluation.budget_impact_pct || 0,
      });

      queryClient.invalidateQueries({ queryKey: ["purchase-requests", user?.id] });
      toast.success(
        status === "auto_approved"
          ? "Request auto-approved! 🎉"
          : "Request submitted for review."
      );
      setView("inbox");
      base44.analytics.track({ eventName: "purchase_request_submitted", properties: { tool: formData.tool_name, status } });
    } catch (err) {
      toast.error("Failed to evaluate request. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleDecision = async (request, status, note) => {
    setSavingId(request.id);
    try {
      await base44.entities.PurchaseRequest.update(request.id, {
        status,
        reviewer: user?.full_name || user?.email,
        reviewer_note: note,
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-requests", user?.id] });
      toast.success(`Request ${status}`);
    } catch {
      toast.error("Failed to update request");
    } finally {
      setSavingId(null);
    }
  };

  const pending = requests?.filter((r) => r.status === "pending" || r.status === "auto_approved") || [];
  const resolved = requests?.filter((r) => r.status === "approved" || r.status === "rejected" || r.status === "deferred") || [];
  const autoApproved = requests?.filter((r) => r.status === "auto_approved").length || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fade()}>
        <h1 className="text-page flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          Purchase Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Every software purchase decision flows through here — evaluated by AI against your stack, budget, and policies.</p>
      </motion.div>

      {/* Stats */}
      {requests && requests.length > 0 && (
        <motion.div {...fade(0.05)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card">
            <ClipboardList className="w-4 h-4 text-muted-foreground mb-1" />
            <p className="text-2xl font-black">{requests.length}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </div>
          <div className="stat-card">
            <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
            <p className="text-2xl font-black">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Awaiting Review</p>
          </div>
          <div className="stat-card">
            <Sparkles className="w-4 h-4 text-primary mb-1" />
            <p className="text-2xl font-black">{autoApproved}</p>
            <p className="text-xs text-muted-foreground">Auto-Approved</p>
          </div>
          <div className="stat-card">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1" />
            <p className="text-2xl font-black">{resolved.filter((r) => r.status === "approved").length}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
        </motion.div>
      )}

      {/* Tab toggle */}
      <motion.div {...fade(0.1)} className="tab-track inline-flex p-1 gap-1">
        <button
          onClick={() => setView("inbox")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === "inbox" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Inbox {pending.length > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{pending.length}</span>}
        </button>
        <button
          onClick={() => setView("submit")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === "submit" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Plus className="w-3.5 h-3.5" />
          New Request
        </button>
      </motion.div>

      {/* Content */}
      {view === "submit" ? (
        <motion.div {...fade(0.1)}>
          <RequestForm user={user} onSubmit={handleSubmit} evaluating={evaluating} />
        </motion.div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : requests?.length === 0 ? (
        <motion.div {...fade(0.1)} className="glass-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No purchase requests yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">When someone requests new software, it'll be evaluated by AI and appear here for review.</p>
          <button
            onClick={() => setView("submit")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Submit First Request
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-section font-bold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Awaiting Review
              </h2>
              <div className="space-y-3">
                {pending.map((r) => (
                  <RequestCard key={r.id} request={r} onDecision={handleDecision} isSaving={savingId === r.id} />
                ))}
              </div>
            </div>
          )}

          {/* Resolved */}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-section font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Resolved
              </h2>
              <div className="space-y-3">
                {resolved.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}