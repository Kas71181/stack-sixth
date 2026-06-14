import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, DollarSign, Users, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Trash2, TrendingDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import NegotiationPlaybookModal from "./NegotiationPlaybookModal";

const STATUS_STYLE = {
  "Active": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Expiring Soon": "bg-amber-50 text-amber-700 border-amber-200",
  "Expired": "bg-red-50 text-red-700 border-red-200",
  "Cancelled": "bg-slate-100 text-slate-500 border-slate-200",
};

export default function ContractCard({ contract, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(false);

  const daysUntilRenewal = contract.renewal_date
    ? differenceInDays(new Date(contract.renewal_date), new Date())
    : null;

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.Contract.delete(contract.id);
    onDeleted();
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
            {contract.vendor_name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="font-bold text-sm">{contract.vendor_name}</p>
            <p className="text-xs text-muted-foreground">{contract.contract_type || "Contract"}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLE[contract.status] || STATUS_STYLE["Active"]}`}>
          {contract.status}
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <p className="text-sm font-extrabold">${(contract.monthly_cost || 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">/month</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 text-center">
          <p className="text-sm font-extrabold">{contract.seats_licensed || "—"}</p>
          <p className="text-[10px] text-muted-foreground">seats</p>
        </div>
        <div className={`rounded-lg p-2 text-center ${daysUntilRenewal !== null && daysUntilRenewal <= 60 ? "bg-amber-50" : "bg-muted/40"}`}>
          <p className={`text-sm font-extrabold ${daysUntilRenewal !== null && daysUntilRenewal <= 60 ? "text-amber-700" : ""}`}>
            {daysUntilRenewal !== null ? (daysUntilRenewal < 0 ? "Expired" : `${daysUntilRenewal}d`) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">until renewal</p>
        </div>
      </div>

      {/* Negotiation leverage highlight */}
      {contract.negotiation_leverage && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <TrendingDown className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-blue-800 mb-0.5">Negotiation Leverage</p>
            <p className="text-xs text-blue-700 leading-snug">{contract.negotiation_leverage}</p>
          </div>
        </div>
      )}

      {/* Playbook CTA */}
      <button
        onClick={() => setShowPlaybook(true)}
        className="w-full flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Negotiation Playbook
      </button>

      {/* Expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? "Hide details" : "Show details"}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border/50 pt-3">
          {contract.renewal_date && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Renews:</span>
              <span className="font-medium">{format(new Date(contract.renewal_date), "MMM d, yyyy")}</span>
            </div>
          )}
          {contract.notice_period_days && (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Notice period:</span>
              <span className="font-medium">{contract.notice_period_days} days</span>
            </div>
          )}
          {contract.auto_renews !== undefined && (
            <div className="flex items-center gap-2 text-xs">
              {contract.auto_renews
                ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              <span>{contract.auto_renews ? "Auto-renews — set a reminder to cancel" : "Manual renewal required"}</span>
            </div>
          )}
          {contract.key_terms?.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key Terms</p>
              <ul className="space-y-0.5">
                {contract.key_terms.map((term, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                    <span className="text-muted-foreground mt-0.5">•</span>{term}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 mt-1"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting..." : "Delete Contract"}
          </Button>
        </div>
      )}
      {showPlaybook && (
        <NegotiationPlaybookModal contract={contract} onClose={() => setShowPlaybook(false)} />
      )}
    </div>
  );
}