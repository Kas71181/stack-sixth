import { useState, useEffect } from "react";
import { X, ExternalLink, CheckCircle2, Circle, Loader2, Rocket, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { toast } from "sonner";

const CHECKLIST_STEPS = [
  { id: "purchase", label: "Purchase / start trial", hint: "Click the vendor link to start your subscription or trial." },
  { id: "account", label: "Create admin account", hint: "Set up the primary admin account for your organization." },
  { id: "invite", label: "Invite team members", hint: "Invite the requesting team to the tool." },
  { id: "integrate", label: "Connect to Stack Sixth", hint: "Add the tool to your live stack for monitoring." },
];

export default function ProvisioningModal({ request, onClose, onProvisioned }) {
  const [buyUrl, setBuyUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [checked, setChecked] = useState({});
  const [provisioning, setProvisioning] = useState(false);
  const { getUrl } = useAffiliateLinks();

  useEffect(() => {
    getUrl(request.tool_name).then((url) => {
      setBuyUrl(url || request.vendor_url);
      setLoadingUrl(false);
    });
  }, [request.tool_name, request.vendor_url]);

  const toggleStep = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const allChecked = CHECKLIST_STEPS.every((s) => checked[s.id]);

  const handleProvision = async () => {
    setProvisioning(true);
    try {
      // Add to live stack
      await base44.entities.SaasIntegration.create({
        tool_name: request.tool_name,
        category: request.category,
        connection_status: "Manual Upload",
        monthly_cost: (request.estimated_monthly_cost || 0) * (request.requested_seats || 1),
        licensed_seats: request.requested_seats || 1,
        active_users: 0,
        notes: `Provisioned from purchase request. Team: ${request.team_affected || "N/A"}`,
      });

      // Mark request as provisioned
      await base44.entities.PurchaseRequest.update(request.id, {
        status: "provisioned",
        reviewer_note: `Provisioned on ${new Date().toLocaleDateString()}`,
      });

      toast.success(`${request.tool_name} added to your stack!`);
      onProvisioned?.();
      onClose();
    } catch {
      toast.error("Failed to provision. Please try again.");
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="glass-strong w-full max-w-lg rounded-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base">Provision {request.tool_name}</h2>
              <p className="text-xs text-muted-foreground">Complete the setup checklist to add this to your stack.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Purchase link */}
          <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Purchase / Trial Link</p>
              <p className="text-xs text-muted-foreground truncate">{buyUrl || "Fetching link…"}</p>
            </div>
            {loadingUrl ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
            ) : buyUrl ? (
              <a
                href={buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            ) : (
              <span className="text-xs text-muted-foreground flex-shrink-0">No link available</span>
            )}
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {CHECKLIST_STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 transition-colors text-left"
              >
                {checked[step.id] ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${checked[step.id] ? "line-through text-muted-foreground" : ""}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.hint}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{Object.values(checked).filter(Boolean).length} / {CHECKLIST_STEPS.length} steps complete</span>
            <span className="font-mono font-medium">${(request.estimated_monthly_cost || 0) * (request.requested_seats || 1)}/mo</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border/40 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={handleProvision}
            disabled={!allChecked || provisioning}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {provisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {provisioning ? "Provisioning…" : "Add to Stack"}
          </button>
        </div>
      </div>
    </div>
  );
}