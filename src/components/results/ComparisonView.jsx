import { useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, Star, ShoppingCart, Check, ArrowRight, DollarSign, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/CartContext";

const PRIORITY_STYLES = {
  high: "bg-primary/10 text-primary border-primary/20",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-muted text-muted-foreground border-border",
};

const RISK_CONFIG = {
  low: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Low" },
  medium: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50", label: "Medium" },
  high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-red-50", label: "High" },
  unknown: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Unknown" },
};

function ScoreBar({ value, max = 100 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-primary w-6 text-right">{value}</span>
    </div>
  );
}

function ComparisonCell({ rec, auditName, monthlyBudget }) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.name === rec.name);
  const risk = RISK_CONFIG[rec.migration_risk] || RISK_CONFIG.unknown;
  const RiskIcon = risk.icon;
  const overBudget = monthlyBudget && rec.estimated_monthly_cost > monthlyBudget;

  return (
    <div className="flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden min-w-[220px] max-w-[280px] flex-1">
      {/* Header */}
      <div className="p-4 border-b border-border/40 bg-accent/20">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-sm leading-tight">{rec.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{rec.category}</p>
          </div>
          <button
            onClick={() => { if (!inCart) addItem(rec, auditName); }}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border font-medium transition-all flex-shrink-0 ${
              inCart
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default"
                : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            }`}
          >
            {inCart ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
            {inCart ? "Added" : "Add"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[10px] font-medium px-1.5 ${PRIORITY_STYLES[rec.implementation_priority] || ""}`}>
            {rec.implementation_priority} priority
          </Badge>
          <Badge variant="outline" className="text-[10px] font-medium px-1.5">
            {rec.adopt_now_or_later === "now" ? "Adopt now" : "Adopt later"}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-4 space-y-3 border-b border-border/40">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Match Score</p>
          <ScoreBar value={rec.match_score || 0} />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Monthly Cost</p>
            <p className={`text-base font-bold font-mono ${overBudget ? "text-destructive" : "text-foreground"}`}>
              {rec.estimated_monthly_cost != null ? `$${rec.estimated_monthly_cost}` : "—"}
              {overBudget && <span className="text-[10px] font-normal ml-1 text-destructive">over budget</span>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Potential Savings</p>
            <p className="text-base font-bold text-emerald-600 font-mono">
              {rec.estimated_savings_opportunity ? `$${rec.estimated_savings_opportunity}/mo` : "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Migration Risk</p>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${risk.bg} ${risk.color}`}>
            <RiskIcon className="w-3 h-3" />
            {risk.label}
          </span>
        </div>

        {rec.replacement_candidate_for && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Replaces</p>
            <p className="text-xs font-medium flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              {rec.replacement_candidate_for}
            </p>
          </div>
        )}
      </div>

      {/* Why It Fits */}
      {rec.why_it_fits?.length > 0 && (
        <div className="p-4 border-b border-border/40 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Why It Fits</p>
          <ul className="space-y-1.5">
            {rec.why_it_fits.slice(0, 3).map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ROI Note */}
      {rec.savings_or_roi_note && (
        <div className="p-4 bg-primary/5">
          <p className="text-[11px] text-primary leading-relaxed">{rec.savings_or_roi_note}</p>
        </div>
      )}
    </div>
  );
}

export default function ComparisonView({ recommendations, auditName, monthlyBudget }) {
  const [selected, setSelected] = useState(() => recommendations.slice(0, 3).map((_, i) => i));

  const toggleSelect = (i) => {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 4 ? [...prev, i] : prev
    );
  };

  const visibleRecs = selected.map((i) => recommendations[i]).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Tool selector */}
      <div className="bg-card border border-border/60 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Select up to 4 tools to compare
        </p>
        <div className="flex flex-wrap gap-2">
          {recommendations.map((rec, i) => (
            <button
              key={i}
              onClick={() => toggleSelect(i)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selected.includes(i)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              } ${!selected.includes(i) && selected.length >= 4 ? "opacity-40 cursor-not-allowed" : ""}`}
              disabled={!selected.includes(i) && selected.length >= 4}
            >
              {rec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison grid */}
      {visibleRecs.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {visibleRecs.map((rec, i) => (
            <ComparisonCell
              key={rec.name + i}
              rec={rec}
              auditName={auditName}
              monthlyBudget={monthlyBudget}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Select at least one tool above to compare.
        </div>
      )}
    </div>
  );
}