import { Trophy, TrendingDown, Check, ExternalLink, Star, Clock } from "lucide-react";
import { useState } from "react";

const STATUS_STYLES = {
  submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  shortlisted: { label: "Shortlisted", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
  selected: { label: "Selected", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
};

export default function BidCard({ bid, isBestPrice, onAction, isSaving }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_STYLES[bid.status] || STATUS_STYLES.submitted;
  const annualCost = (bid.proposed_monthly_cost || 0) * (bid.contract_term_months || 12);

  return (
    <div className={`glass-card overflow-hidden hover-lift ${bid.status === "selected" ? "ring-2 ring-emerald-400/40" : ""}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        className="w-full p-4 flex items-center gap-3 cursor-pointer select-none"
      >
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          {isBestPrice && bid.status !== "rejected" ? (
            <Trophy className="w-4 h-4 text-amber-500" />
          ) : (
            <span className="text-sm font-bold text-primary">{bid.vendor_name?.charAt(0) || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{bid.vendor_name}</h3>
            <span className={`badge-pill border ${status.cls} flex-shrink-0`}>{status.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="font-mono font-medium text-foreground">${bid.proposed_monthly_cost}/mo</span>
            {bid.discount_pct > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                  <TrendingDown className="w-3 h-3" /> {bid.discount_pct}% off
                </span>
              </>
            )}
            <span>·</span>
            <span>{bid.proposed_seats} seats</span>
            <span>·</span>
            <span>{bid.contract_term_months}mo term</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-3">
          {/* Annual cost */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Annual Cost</p>
              <p className="text-lg font-black">${annualCost.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Per Seat / Mo</p>
              <p className="text-lg font-black">${bid.proposed_seats > 0 ? (bid.proposed_monthly_cost / bid.proposed_seats).toFixed(2) : bid.proposed_monthly_cost}</p>
            </div>
          </div>

          {/* Pitch */}
          {bid.pitch && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Vendor Pitch</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{bid.pitch}</p>
            </div>
          )}

          {/* Differentiators */}
          {bid.key_differentiators?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Key Differentiators</p>
              <ul className="space-y-1">
                {bid.key_differentiators.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Star className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact + demo */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {bid.vendor_email && <span className="text-muted-foreground">{bid.vendor_email}</span>}
            {bid.demo_url && (
              <a href={bid.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <ExternalLink className="w-3 h-3" /> Demo
              </a>
            )}
          </div>

          {/* Actions */}
          {onAction && bid.status !== "selected" && bid.status !== "rejected" && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => onAction(bid, "shortlisted")}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 transition-colors disabled:opacity-50"
              >
                <Star className="w-3.5 h-3.5" /> Shortlist
              </button>
              <button
                onClick={() => onAction(bid, "selected")}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Select Winner
              </button>
              <button
                onClick={() => onAction(bid, "rejected")}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 transition-colors disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}