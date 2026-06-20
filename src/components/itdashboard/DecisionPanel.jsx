import { CheckCircle2, XCircle, Clock, X, Loader2, AlertTriangle, Info, DollarSign, Link2, TrendingDown, ArrowRight, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/CartContext";

const RISK_CONFIG = {
  Low: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  Medium: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  High: { color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
};

const Section = ({ title, children }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
    {children}
  </div>
);

export default function DecisionPanel({ tool, onDecision, isSaving, onClose }) {
  const { addItem, items } = useCart();

  if (!tool) {
    return (
      <div className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
          <Info className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-foreground">Select a tool to review</p>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-[180px] leading-relaxed">
          Click any row in the table to see details and make a decision
        </p>
        <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground/60">
          <ArrowRight className="w-3 h-3" />
          <span>Details will appear here</span>
        </div>
      </div>
    );
  }

  const current = tool._decision;
  const risk = RISK_CONFIG[tool.migration_risk] || RISK_CONFIG.Low;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm sticky top-24">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-base truncate">{tool.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border/60">
                {tool.category}
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground truncate">{tool._auditName}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5 hover:bg-muted rounded-lg p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
        {/* Score + Cost grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Match Score</p>
            <p className="text-3xl font-black text-primary">{tool.match_score ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">/100</p>
          </div>
          <div className="bg-muted/40 border border-border/60 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Monthly Cost</p>
            <p className="text-3xl font-black text-foreground font-mono">
              {tool.estimated_monthly_cost != null ? `$${tool.estimated_monthly_cost}` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">/month</p>
          </div>
        </div>

        {/* Savings highlight */}
        {tool.estimated_savings_opportunity > 0 && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-medium">Potential Savings</p>
              <p className="text-lg font-black text-emerald-700 font-mono">${tool.estimated_savings_opportunity}<span className="text-sm font-normal">/mo</span></p>
            </div>
          </div>
        )}

        {/* ROI note */}
        {tool.savings_or_roi_note && (
          <Section title="ROI Note">
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-3">
              {tool.savings_or_roi_note}
            </p>
          </Section>
        )}

        {/* Why it fits */}
        {tool.why_it_fits?.length > 0 && (
          <Section title="Why It Fits">
            <ul className="space-y-2">
              {tool.why_it_fits.map((w, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Integration notes */}
        {tool.integration_notes?.length > 0 && (
          <Section title="Integration Notes">
            <ul className="space-y-2">
              {tool.integration_notes.map((n, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Link2 className="w-3 h-3 text-blue-500" />
                  </div>
                  <span className="text-muted-foreground leading-relaxed">{n}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Migration risk */}
        {tool.migration_risk && (
          <div className={`flex items-center gap-2.5 text-sm px-3.5 py-3 rounded-xl border ${risk.bg}`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${risk.dot}`} />
            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${risk.color}`} />
            <div>
              <span className={`font-semibold text-xs ${risk.color}`}>Migration Risk: </span>
              <span className={`text-xs ${risk.color}`}>{tool.migration_risk}</span>
            </div>
          </div>
        )}

        {/* Extra meta */}
        <div className="space-y-2">
          {tool.replacement_candidate_for && (
            <div className="flex items-center justify-between bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2.5">
              <span className="text-xs text-muted-foreground">Replaces</span>
              <span className="text-xs font-semibold text-foreground">{tool.replacement_candidate_for}</span>
            </div>
          )}
          {tool.adopt_now_or_later && (
            <div className="flex items-center justify-between bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2.5">
              <span className="text-xs text-muted-foreground">Timing</span>
              <span className="text-xs font-semibold text-foreground">{tool.adopt_now_or_later}</span>
            </div>
          )}
        </div>
      </div>

      {/* Add to Cart */}
      <div className="px-5 pt-4 border-t border-border/40">
        {(() => {
          const inCart = items.some((i) => i.name === tool.name);
          return (
            <button
              onClick={() => { if (!inCart) addItem({ name: tool.name, category: tool.category, estimated_monthly_cost: tool.estimated_monthly_cost, estimated_savings_opportunity: tool.estimated_savings_opportunity, match_score: tool.match_score }, tool._auditName); }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${inCart ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default" : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"}`}
            >
              {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {inCart ? "Added to Cart" : "Add to Cart"}
            </button>
          );
        })()}
      </div>

      {/* Decision buttons */}
      <div className="px-5 py-4 bg-muted/20">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Make a Decision</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onDecision(tool, "approve")}
            disabled={isSaving}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
              current === "approve"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:shadow-sm"
            }`}
          >
            {isSaving && current === "approve" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Approve
          </button>
          <button
            onClick={() => onDecision(tool, "defer")}
            disabled={isSaving}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
              current === "defer"
                ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:shadow-sm"
            }`}
          >
            <Clock className="w-4 h-4" />
            Defer
          </button>
          <button
            onClick={() => onDecision(tool, "reject")}
            disabled={isSaving}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
              current === "reject"
                ? "bg-red-500 text-white border-red-600 shadow-md shadow-red-200"
                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:shadow-sm"
            }`}
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}