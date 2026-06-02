import { ChevronDown, ArrowRight, Link2, Star, Clock, AlertTriangle, CheckCircle2, ShoppingCart, Check, ExternalLink, ShieldCheck, SendHorizonal, Database, GitBranch, Calendar, FileOutput } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/CartContext";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { useAuth } from "@/lib/AuthContext";

function ToolLogo({ name, index }) {
  const [imgError, setImgError] = useState(false);
  const domain = name.toLowerCase().replace(/\s+/g, "") + ".com";
  const logoUrl = `https://logo.clearbit.com/${domain}`;

  if (!imgError) {
    return (
      <div className="w-10 h-10 rounded-xl bg-white border border-border/60 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img
          src={logoUrl}
          alt={name}
          className="w-7 h-7 object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-primary">{index + 1}</span>
    </div>
  );
}

const PRIORITY_STYLES = {
  high: "bg-primary/10 text-primary border-primary/20",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-muted text-muted-foreground border-border",
};

const RISK_ICONS = {
  low: { icon: CheckCircle2, color: "text-primary" },
  medium: { icon: AlertTriangle, color: "text-yellow-600" },
  high: { icon: AlertTriangle, color: "text-destructive" },
  unknown: { icon: Clock, color: "text-muted-foreground" },
};

const APPROVAL_STATUS = {
  none: null,
  pending: "pending",
  approved: "approved",
};

// Lock-in risk based on known tool characteristics
const LOCK_IN_DATA = {
  salesforce: { score: "High", export: "CSV/API", deps: "4-6 integrations", weeks: "8-12" },
  hubspot: { score: "High", export: "CSV/API", deps: "3-5 integrations", weeks: "6-10" },
  netsuite: { score: "High", export: "CSV/API", deps: "5-8 integrations", weeks: "12-16" },
  zendesk: { score: "Medium", export: "CSV/JSON", deps: "2-4 integrations", weeks: "4-6" },
  jira: { score: "Medium", export: "CSV/XML/API", deps: "3-5 integrations", weeks: "4-8" },
  notion: { score: "Low", export: "Markdown/CSV/PDF", deps: "1-2 integrations", weeks: "1-2" },
  airtable: { score: "Low", export: "CSV/JSON", deps: "1-3 integrations", weeks: "2-4" },
  slack: { score: "Medium", export: "JSON export", deps: "3-6 integrations", weeks: "3-5" },
  intercom: { score: "Medium", export: "CSV/JSON", deps: "2-4 integrations", weeks: "4-6" },
  monday: { score: "Low", export: "CSV/Excel", deps: "1-3 integrations", weeks: "2-3" },
};

const LOCK_IN_COLORS = {
  High: "text-destructive bg-destructive/10 border-destructive/20",
  Medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  Low: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

function getLockInData(toolName) {
  const key = toolName?.toLowerCase().replace(/\s+/g, "");
  return LOCK_IN_DATA[key] || null;
}

export default function RecommendationCard({ rec, index, auditName = "" }) {
  const [expanded, setExpanded] = useState(false);
  const { addItem, items } = useCart();
  const { getUrl } = useAffiliateLinks();
  const [buyUrl, setBuyUrl] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(APPROVAL_STATUS.none);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const inCart = items.some((i) => i.name === rec.name);

  useEffect(() => {
    getUrl(rec.name).then(setBuyUrl);
  }, [rec.name]);

  const RiskIcon = RISK_ICONS[rec.migration_risk]?.icon || Clock;
  const riskColor = RISK_ICONS[rec.migration_risk]?.color || "text-muted-foreground";
  const lockIn = getLockInData(rec.replacement_candidate_for || rec.name);

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <ToolLogo name={rec.name} index={index} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-base">{rec.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{rec.category}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {rec.estimated_monthly_cost != null && (
                <span className="text-sm font-mono font-medium">${rec.estimated_monthly_cost}/mo</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); if (!inCart) addItem(rec, auditName); }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  inCart
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default"
                    : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                }`}
              >
                {inCart ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                {inCart ? "Added" : "Add"}
              </button>
              {buyUrl && (
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium bg-primary text-primary-foreground border-primary hover:bg-primary/90 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Buy
                </a>
              )}
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-xs font-semibold">{rec.match_score}</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-medium px-2 ${PRIORITY_STYLES[rec.implementation_priority] || ""}`}
            >
              {rec.implementation_priority} priority
            </Badge>
            <Badge variant="outline" className="text-[10px] font-medium px-2">
              {rec.adopt_now_or_later === "now" ? "Adopt now" : "Adopt later"}
            </Badge>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-border/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Why It Fits
              </p>
              <ul className="space-y-1.5">
                {rec.why_it_fits?.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Integrations
              </p>
              <ul className="space-y-1.5">
                {rec.integration_notes?.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {rec.savings_or_roi_note && (
              <div className="bg-primary/5 rounded-lg px-4 py-2.5">
                <p className="text-sm text-primary font-medium">{rec.savings_or_roi_note}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <RiskIcon className={`w-3.5 h-3.5 ${riskColor}`} />
                Migration risk: {rec.migration_risk}
              </span>
              {rec.replacement_candidate_for && (
                <span className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Replaces: {rec.replacement_candidate_for}
                </span>
              )}
              {rec.estimated_savings_opportunity != null && (
                <span className="font-medium text-primary">
                  Save ~${rec.estimated_savings_opportunity}/mo
                </span>
              )}
            </div>

            {/* Lock-in Risk Panel */}
            {lockIn && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Switching Cost Analysis</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LOCK_IN_COLORS[lockIn.score]}`}>
                    {lockIn.score} Lock-in
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <FileOutput className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Data Export</p>
                    <p className="text-xs font-semibold mt-0.5">{lockIn.export}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Dependencies</p>
                    <p className="text-xs font-semibold mt-0.5">{lockIn.deps}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Parallel Run</p>
                    <p className="text-xs font-semibold mt-0.5">{lockIn.weeks} wks</p>
                  </div>
                </div>
              </div>
            )}

            {/* Approval workflow */}
            <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-3 flex-wrap">
              {approvalStatus === APPROVAL_STATUS.none && (
                <button
                  onClick={() => setApprovalStatus(APPROVAL_STATUS.pending)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  <SendHorizonal className="w-3.5 h-3.5" />
                  Submit for Approval
                </button>
              )}
              {approvalStatus === APPROVAL_STATUS.pending && !isAdmin && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Awaiting admin approval
                </span>
              )}
              {approvalStatus === APPROVAL_STATUS.pending && isAdmin && (
                <>
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Pending your approval
                  </span>
                  <button
                    onClick={() => setApprovalStatus(APPROVAL_STATUS.approved)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => setApprovalStatus(APPROVAL_STATUS.none)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              {approvalStatus === APPROVAL_STATUS.approved && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}