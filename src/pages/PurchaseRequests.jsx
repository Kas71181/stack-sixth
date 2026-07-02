import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { ClipboardList, Plus, CheckCircle2, Sparkles, ShieldCheck, AlertTriangle, Inbox } from "lucide-react";
import RequestForm from "@/components/purchasing/RequestForm";
import RequestCard from "@/components/purchasing/RequestCard";
import { toast } from "sonner";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const RESOLVED_STATUSES = ["approved", "rejected", "deferred", "provisioned"];

export default function PurchaseRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";
  const [view, setView] = useState(isAdmin ? "queue" : "mine");
  const [evaluating, setEvaluating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  // Fetch all — RLS ensures non-admins only see their own
  const { data: requests, isLoading } = useQuery({
    queryKey: ["purchase-requests", user?.id],
    queryFn: () => base44.entities.PurchaseRequest.filter({}, "-created_date", 100),
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
      setView(isAdmin ? "queue" : "mine");
      base44.analytics.track({ eventName: "purchase_request_submitted", properties: { tool: formData.tool_name, status } });
    } catch {
      toast.error("Failed to evaluate request. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleDecision = async (request, status, note) => {
    setSavingId(request.id);
    try {
      await base44.functions.invoke("approvePurchaseRequest", {
        request_id: request.id,
        status,
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

  // Split data
  const myRequests = requests?.filter((r) => r.created_by_id === user?.id) || [];
  const queuePending = requests?.filter((r) => r.status === "pending" || r.status === "auto_approved") || [];
  const queueResolved = requests?.filter((r) => RESOLVED_STATUSES.includes(r.status)) || [];
  const myPending = myRequests.filter((r) => r.status === "pending" || r.status === "auto_approved");
  const myResolved = myRequests.filter((r) => RESOLVED_STATUSES.includes(r.status));
  const autoApproved = requests?.filter((r) => r.status === "auto_approved").length || 0;
  const approvedCount = requests?.filter((r) => r.status === "approved").length || 0;

  const tabs = isAdmin
    ? [
        { key: "queue", label: "Approval Queue", icon: Inbox, count: queuePending.length },
        { key: "mine", label: "My Requests", icon: ClipboardList, count: myRequests.length },
        { key: "submit", label: "New Request", icon: Plus },
      ]
    : [
        { key: "mine", label: "My Requests", icon: ClipboardList, count: myRequests.length },
        { key: "submit", label: "New Request", icon: Plus },
      ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fade()}>
        <h1 className="text-page flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          Purchase Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin
            ? "Review and approve software purchase requests from your team — evaluated by AI against your stack, budget, and policies."
            : "Submit software requests for IT manager review. Each request is evaluated by AI before approval."}
        </p>
      </motion.div>

      {/* Stats */}
      {requests && requests.length > 0 && (
        <motion.div {...fade(0.05)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isAdmin ? (
            <>
              <div className="stat-card">
                <Inbox className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="text-2xl font-black">{queuePending.length}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
              <div className="stat-card">
                <Sparkles className="w-4 h-4 text-primary mb-1" />
                <p className="text-2xl font-black">{autoApproved}</p>
                <p className="text-xs text-muted-foreground">Auto-Approved</p>
              </div>
              <div className="stat-card">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1" />
                <p className="text-2xl font-black">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="stat-card">
                <ClipboardList className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="text-2xl font-black">{requests.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <ClipboardList className="w-4 h-4 text-muted-foreground mb-1" />
                <p className="text-2xl font-black">{myRequests.length}</p>
                <p className="text-xs text-muted-foreground">My Requests</p>
              </div>
              <div className="stat-card">
                <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
                <p className="text-2xl font-black">{myPending.length}</p>
                <p className="text-xs text-muted-foreground">Awaiting Review</p>
              </div>
              <div className="stat-card">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1" />
                <p className="text-2xl font-black">{myResolved.filter((r) => r.status === "approved").length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="stat-card">
                <Sparkles className="w-4 h-4 text-primary mb-1" />
                <p className="text-2xl font-black">{myRequests.filter((r) => r.status === "auto_approved").length}</p>
                <p className="text-xs text-muted-foreground">Auto-Approved</p>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div {...fade(0.1)} className="tab-track inline-flex p-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === tab.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
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
      ) : view === "queue" && isAdmin ? (
        queuePending.length === 0 && queueResolved.length === 0 ? (
          <EmptyState onAction={() => setView("submit")} icon={Inbox} title="Approval queue is empty" desc="When team members submit software requests, they'll appear here for your review." actionLabel="Submit a Request" />
        ) : (
          <div className="space-y-6">
            {queuePending.length > 0 && (
              <RequestSection title="Awaiting Review" icon={AlertTriangle} iconClass="text-amber-500" items={queuePending} onDecision={handleDecision} isSaving={savingId} isAdmin={isAdmin} onProvisioned={() => queryClient.invalidateQueries({ queryKey: ["purchase-requests", user?.id] })} />
            )}
            {queueResolved.length > 0 && (
              <RequestSection title="Resolved" icon={CheckCircle2} iconClass="text-emerald-500" items={queueResolved} onDecision={handleDecision} isSaving={savingId} isAdmin={isAdmin} onProvisioned={() => queryClient.invalidateQueries({ queryKey: ["purchase-requests", user?.id] })} />
            )}
          </div>
        )
      ) : myRequests.length === 0 ? (
        <EmptyState onAction={() => setView("submit")} icon={ClipboardList} title="No requests yet" desc="Submit your first software request and it'll be evaluated by AI before going to your IT manager for approval." actionLabel="Submit First Request" />
      ) : (
        <div className="space-y-6">
          {myPending.length > 0 && (
            <RequestSection title="Awaiting Review" icon={AlertTriangle} iconClass="text-amber-500" items={myPending} onDecision={handleDecision} isSaving={savingId} isAdmin={isAdmin} onProvisioned={() => queryClient.invalidateQueries({ queryKey: ["purchase-requests", user?.id] })} />
          )}
          {myResolved.length > 0 && (
            <RequestSection title="Resolved" icon={CheckCircle2} iconClass="text-emerald-500" items={myResolved} onDecision={handleDecision} isSaving={savingId} isAdmin={isAdmin} onProvisioned={() => queryClient.invalidateQueries({ queryKey: ["purchase-requests", user?.id] })} />
          )}
        </div>
      )}
    </div>
  );
}

function RequestSection({ title, icon: Icon, iconClass, items, onDecision, isSaving, isAdmin, onProvisioned }) {
  return (
    <div>
      <h2 className="text-section font-bold mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        {title}
      </h2>
      <div className="space-y-3">
        {items.map((r) => (
          <RequestCard key={r.id} request={r} onDecision={onDecision} isSaving={isSaving} isAdmin={isAdmin} onProvisioned={onProvisioned} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onAction, icon: Icon, title, desc, actionLabel }) {
  return (
    <motion.div {...fade(0.1)} className="glass-card p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{desc}</p>
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" /> {actionLabel}
      </button>
    </motion.div>
  );
}