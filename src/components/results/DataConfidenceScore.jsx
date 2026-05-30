import { ShieldCheck, ShieldAlert, ShieldX, Info } from "lucide-react";
import { useState } from "react";

function computeConfidence(audit) {
  let score = 0;
  let total = 0;
  const reasons = [];
  const warnings = [];

  // Has company website (ICP detection) — 20pts
  total += 20;
  if (audit.company_website && audit.icp_profile) {
    score += 20;
    reasons.push("ICP profile detected from website");
  } else {
    warnings.push("No website provided — recommendations use manual input only");
  }

  // Has existing software — 20pts
  total += 20;
  const sw = audit.existing_software || [];
  if (sw.length > 0) {
    score += 20;
    reasons.push(`${sw.length} existing tool${sw.length > 1 ? "s" : ""} provided`);
  } else {
    warnings.push("No existing software entered — stack recommendations may be generic");
  }

  // Costs provided on tools — 20pts
  total += 20;
  const withCosts = sw.filter((t) => t.monthly_cost > 0);
  if (withCosts.length > 0 && withCosts.length >= sw.length * 0.5) {
    score += 20;
    reasons.push(`Cost data provided for ${withCosts.length}/${sw.length} tools`);
  } else if (sw.length > 0) {
    score += 8;
    warnings.push("Most tools are missing cost data — savings estimates may be inaccurate");
  }

  // Monthly budget set — 15pts
  total += 15;
  if (audit.monthly_budget) {
    score += 15;
    reasons.push("Monthly budget defined");
  } else {
    warnings.push("No budget set — budget-fit analysis is approximate");
  }

  // Business processes filled — 15pts
  total += 15;
  if ((audit.business_processes || []).length >= 2) {
    score += 15;
    reasons.push("Business processes documented");
  } else {
    warnings.push("Few business processes selected — workflow fit may be generic");
  }

  // Pain points filled — 10pts
  total += 10;
  if ((audit.pain_points || []).length >= 1) {
    score += 10;
    reasons.push("Pain points identified");
  }

  const pct = Math.round((score / total) * 100);
  return { pct, reasons, warnings };
}

export default function DataConfidenceScore({ audit }) {
  const { pct, reasons, warnings } = computeConfidence(audit);
  const [expanded, setExpanded] = useState(false);

  const level = pct >= 75 ? "high" : pct >= 45 ? "medium" : "low";
  const config = {
    high: { label: "High Confidence", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500", Icon: ShieldCheck },
    medium: { label: "Medium Confidence", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-400", Icon: ShieldAlert },
    low: { label: "Low Confidence", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", bar: "bg-red-400", Icon: ShieldX },
  }[level];

  return (
    <div className={`rounded-2xl border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <config.Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
          <div>
            <p className={`text-sm font-bold ${config.color}`}>{config.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Data quality score: {pct}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-black/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${config.bar} transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-xs font-medium underline underline-offset-2 ${config.color} hover:opacity-80`}
          >
            {expanded ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {reasons.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">What's helping accuracy</p>
              <ul className="space-y-1">
                {reasons.map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">What's reducing accuracy</p>
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-amber-700">
                    <Info className="w-3 h-3 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}