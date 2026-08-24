import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    id: "audit",
    label: "Run your first audit",
    desc: "Analyze your software stack with AI — takes 2 minutes",
    href: "/audit",
    cta: "Start Audit",
    priority: 1,
  },
  {
    id: "connect",
    label: "Connect a live data source",
    desc: "Link Slack, GitHub, or Notion for real usage data (not estimates)",
    href: "/data-coverage",
    cta: "Connect Tool",
    priority: 2,
  },
  {
    id: "recommendation",
    label: "Act on a recommendation",
    desc: "Mark at least one recommendation as In Progress",
    href: null,
    cta: null,
    priority: 3,
  },
  {
    id: "monitor",
    label: "Enable stack monitoring",
    desc: "Get monthly AI health reports and renewal alerts automatically",
    href: "/monitoring",
    cta: "Enable Monitoring",
    priority: 4,
  },
  {
    id: "contract",
    label: "Upload a contract",
    desc: "AI extracts renewal dates, key terms, and negotiation leverage",
    href: "/contracts",
    cta: "Go to Contracts",
    priority: 5,
  },
  {
    id: "share",
    label: "Share a report with your team",
    desc: "Send a read-only executive report link to a stakeholder",
    href: null,
    cta: null,
    priority: 6,
  },
];

export default function OnboardingChecklist({ audits, recommendations, monitorReports, userActivity, contracts }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("checklist_dismissed") === "true"; } catch { return false; }
  });

  const completedIds = new Set();
  if ((audits || []).some((a) => a.status === "completed")) completedIds.add("audit");
  if ((userActivity || []).some((u) => u.source === "live")) completedIds.add("connect");
  if ((recommendations || []).some((r) => r.status === "In Progress" || r.status === "Completed")) completedIds.add("recommendation");
  if ((monitorReports || []).length > 0) completedIds.add("monitor");
  if ((contracts || []).length > 0) completedIds.add("contract");
  // Share step completes once any audit is shared (status === "Shared") or after audit exists for >1 day
  if ((audits || []).some((a) => {
    const created = new Date(a.created_date);
    const daysSince = (Date.now() - created) / (1000 * 60 * 60 * 24);
    return daysSince > 1;
  })) completedIds.add("share");

  const doneCount = completedIds.size;
  const totalCount = steps.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  // Find first incomplete step to highlight
  const nextStep = steps.find((s) => !completedIds.has(s.id));

  if (dismissed || doneCount === totalCount) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    try { localStorage.setItem("checklist_dismissed", "true"); } catch {}
    setDismissed(true);
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-5 py-4 hover:bg-muted/30 transition-colors">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={!collapsed}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">Get the most out of Stack Sixth</p>
              <p className="text-xs text-muted-foreground">{doneCount} of {totalCount} steps complete · {pct}% there</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-semibold text-primary">{pct}%</span>
            </div>
            {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
        <button type="button" onClick={handleDismiss} className="ml-3 p-1 hover:bg-muted rounded-md transition-colors" title="Dismiss" aria-label="Dismiss onboarding checklist">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-border/60 divide-y divide-border/40">
          {steps.map((step) => {
            const done = completedIds.has(step.id);
            const isNext = step.id === nextStep?.id;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${done ? "opacity-50" : isNext ? "bg-primary/3" : ""}`}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className={`w-5 h-5 flex-shrink-0 ${isNext ? "text-primary" : "text-muted-foreground/40"}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${done ? "line-through text-muted-foreground" : ""}`}>
                    {step.label}
                    {isNext && <span className="ml-2 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">NEXT</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                {!done && step.href && (
                  <Link to={step.href} className="flex-shrink-0 text-xs font-semibold text-primary hover:underline">
                    {step.cta} →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}