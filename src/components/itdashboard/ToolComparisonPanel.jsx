import { useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, X, Columns2, ChevronDown } from "lucide-react";

const RISK_CONFIG = {
  low: { color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Low" },
  medium: { color: "text-yellow-700 bg-yellow-50 border-yellow-200", label: "Medium" },
  high: { color: "text-destructive bg-destructive/5 border-destructive/20", label: "High" },
};

const PRIORITY_COLOR = {
  high: "text-primary bg-primary/10 border-primary/20",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  low: "text-muted-foreground bg-muted border-border",
};

function RiskBadge({ risk }) {
  const cfg = RISK_CONFIG[risk] || { color: "text-muted-foreground bg-muted border-border", label: risk || "Unknown" };
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label} Risk
    </span>
  );
}

function ScoreRing({ score }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = circ - (circ * (score || 0)) / 100;
  const color = score >= 75 ? "#2563eb" : score >= 50 ? "#d97706" : "#ef4444";
  return (
    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} stroke="hsl(var(--border))" strokeWidth="4" fill="none" />
        <circle cx="24" cy="24" r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={circ} strokeDashoffset={fill} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[11px] font-bold" style={{ color }}>{score ?? "—"}</span>
    </div>
  );
}

function ToolColumn({ tool, label, onClear, allTools, onSwap }) {
  const [open, setOpen] = useState(false);

  if (!tool) {
    return (
      <div className="flex-1 min-w-0 border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 min-h-[300px]">
        <Columns2 className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground font-medium">Select a tool</p>
        <div className="relative w-full max-w-[200px]">
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-card border border-border/60 rounded-xl text-sm text-foreground hover:border-primary/40 transition-colors"
          >
            <span className="text-muted-foreground">Choose tool…</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {allTools.map((t) => (
                <button
                  key={t.name + t._auditId}
                  onClick={() => { onSwap(t); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground text-xs ml-2">{t._auditName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-accent/20 border-b border-border/40 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          </div>
          <h3 className="font-bold text-base mt-0.5 leading-tight">{tool.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{tool.category} · {tool._auditName}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tool.implementation_priority && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_COLOR[tool.implementation_priority] || PRIORITY_COLOR.low}`}>
                {tool.implementation_priority} priority
              </span>
            )}
            {tool.adopt_now_or_later && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
                {tool.adopt_now_or_later === "now" ? "Adopt now" : "Adopt later"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ScoreRing score={tool.match_score} />
          <button onClick={onClear} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="px-5 py-4 border-b border-border/40 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Monthly Cost</p>
            <p className="text-lg font-bold font-mono text-foreground">
              {tool.estimated_monthly_cost != null ? `$${tool.estimated_monthly_cost.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Savings Opportunity</p>
            <p className="text-lg font-bold font-mono text-emerald-600">
              {tool.estimated_savings_opportunity ? `$${tool.estimated_savings_opportunity.toLocaleString()}/mo` : "—"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Migration Risk</p>
          <RiskBadge risk={tool.migration_risk} />
        </div>
        {tool.replacement_candidate_for && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Replaces</p>
            <p className="text-xs font-medium text-foreground">→ {tool.replacement_candidate_for}</p>
          </div>
        )}
      </div>

      {/* Why it fits */}
      {tool.why_it_fits?.length > 0 && (
        <div className="px-5 py-4 border-b border-border/40">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Why It Fits</p>
          <ul className="space-y-1.5">
            {tool.why_it_fits.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Integration notes */}
      {tool.integration_notes?.length > 0 && (
        <div className="px-5 py-4 border-b border-border/40">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Integration Notes</p>
          <ul className="space-y-1.5">
            {tool.integration_notes.map((n, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ROI note */}
      {tool.savings_or_roi_note && (
        <div className="px-5 py-4 bg-primary/5">
          <p className="text-[11px] text-primary leading-relaxed italic">{tool.savings_or_roi_note}</p>
        </div>
      )}

      {/* Decision badge */}
      {tool._decision && (
        <div className={`px-5 py-3 text-xs font-semibold text-center ${
          tool._decision === "approve" ? "bg-emerald-50 text-emerald-700" :
          tool._decision === "reject" ? "bg-destructive/5 text-destructive" :
          "bg-muted text-muted-foreground"
        }`}>
          Decision: {tool._decision.charAt(0).toUpperCase() + tool._decision.slice(1)}
        </div>
      )}
    </div>
  );
}

export default function ToolComparisonPanel({ tools }) {
  const [toolA, setToolA] = useState(null);
  const [toolB, setToolB] = useState(null);

  const availableForA = tools.filter((t) => t !== toolB);
  const availableForB = tools.filter((t) => t !== toolA);

  if (tools.length < 2) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Columns2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">Tool Comparison</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Select two tools to compare costs and features side-by-side</p>
        </div>
      </div>

      <div className="flex gap-4">
        <ToolColumn
          tool={toolA}
          label="Tool A"
          allTools={availableForA}
          onSwap={setToolA}
          onClear={() => setToolA(null)}
        />
        <ToolColumn
          tool={toolB}
          label="Tool B"
          allTools={availableForB}
          onSwap={setToolB}
          onClear={() => setToolB(null)}
        />
      </div>

      {/* Cost diff callout */}
      {toolA && toolB &&
        toolA.estimated_monthly_cost != null &&
        toolB.estimated_monthly_cost != null && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 border border-border/60 rounded-xl px-4 py-3">
          <span className="font-medium text-foreground">{toolA.name}</span>
          <span>vs</span>
          <span className="font-medium text-foreground">{toolB.name}</span>
          <span>—</span>
          {(() => {
            const diff = Math.abs(toolA.estimated_monthly_cost - toolB.estimated_monthly_cost);
            const cheaper = toolA.estimated_monthly_cost < toolB.estimated_monthly_cost ? toolA.name : toolB.name;
            return (
              <span className="font-semibold text-emerald-600">
                {cheaper} is ${diff.toLocaleString()}/mo cheaper
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}