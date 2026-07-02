import { CheckCircle2, XCircle, Clock, AlertTriangle, TrendingDown, Sparkles, ExternalLink, ShieldCheck, Rocket } from "lucide-react";
import { useState } from "react";
import ProvisioningModal from "@/components/purchasing/ProvisioningModal";

const STATUS_STYLES = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  auto_approved: { label: "Auto-Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Sparkles },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
  deferred: { label: "Deferred", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  provisioned: { label: "Provisioned", cls: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 },
};

export default function RequestCard({ request, onDecision, isSaving, onProvisioned }) {
  const [expanded, setExpanded] = useState(false);
  const [showProvision, setShowProvision] = useState(false);
  const [reviewerNote, setReviewerNote] = useState(request.reviewer_note || "");
  const status = STATUS_STYLES[request.status] || STATUS_STYLES.pending;
  const StatusIcon = status.icon;

  const totalCost = (request.estimated_monthly_cost || 0) * (request.requested_seats || 1);

  return (
    <div className="glass-card overflow-hidden hover-lift">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        className="w-full p-4 flex items-center gap-3 cursor-pointer select-none"
      >
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <StatusIcon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{request.tool_name}</h3>
            <span className={`badge-pill border ${status.cls} flex-shrink-0`}>{status.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{request.category}</span>
            <span>·</span>
            <span className="font-mono font-medium">${totalCost}/mo</span>
            <span>·</span>
            <span>{request.requested_seats} seat{request.requested_seats !== 1 ? "s" : ""}</span>
            {request.budget_impact_pct > 0 && (
              <>
                <span>·</span>
                <span className="text-primary font-medium">{request.budget_impact_pct}% of budget</span>
              </>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
          {/* AI Decision */}
          {request.decision_reason && (
            <div className="bg-primary/5 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Assessment</p>
              </div>
              <p className="text-sm leading-relaxed">{request.decision_reason}</p>
            </div>
          )}

          {/* Conflict flags */}
          {request.conflict_flags?.length > 0 && (
            <div className="space-y-1.5">
              {request.conflict_flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          )}

          {/* Redundancy warnings */}
          {request.redundancy_warnings?.length > 0 && (
            <div className="space-y-1.5">
              {request.redundancy_warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
                  <TrendingDown className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Requester details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {request.requester_name && (
              <div><span className="text-muted-foreground">Requester:</span> <span className="font-medium">{request.requester_name}</span></div>
            )}
            {request.team_affected && (
              <div><span className="text-muted-foreground">Team:</span> <span className="font-medium">{request.team_affected}</span></div>
            )}
            {request.vendor_url && (
              <a href={request.vendor_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> Vendor site
              </a>
            )}
          </div>

          {request.justification && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Justification</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{request.justification}</p>
            </div>
          )}

          {/* Decision actions — only for pending/auto_approved that need review */}
          {(request.status === "pending" || request.status === "auto_approved") && onDecision && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <input
                type="text"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Add a reviewer note (optional)…"
                className="w-full text-xs bg-muted/60 border border-border/60 rounded-lg px-3 py-1.5 outline-none focus:border-primary/50"
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onDecision(request, "approved", reviewerNote)}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => onDecision(request, "deferred", reviewerNote)}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <Clock className="w-3.5 h-3.5" /> Defer
                </button>
                <button
                  onClick={() => onDecision(request, "rejected", reviewerNote)}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          )}

          {request.status === "approved" && (
            <div className="pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Approved{request.reviewer ? ` by ${request.reviewer}` : ""}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowProvision(true); }}
                className="flex items-center gap-1.5 px-3 py-2 w-full justify-center rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Rocket className="w-3.5 h-3.5" /> Provision Tool
              </button>
            </div>
          )}

          {request.status === "provisioned" && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-1">
              <Rocket className="w-3.5 h-3.5" /> Provisioned — added to your stack
            </div>
          )}
        </div>
      )}

      {showProvision && (
        <ProvisioningModal
          request={request}
          onClose={() => setShowProvision(false)}
          onProvisioned={onProvisioned}
        />
      )}
    </div>
  );
}