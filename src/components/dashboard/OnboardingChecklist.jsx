import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    id: "audit",
    label: "Run your first audit",
    desc: "Analyze your software stack with AI",
    href: "/audit",
    cta: "Start Audit",
  },
  {
    id: "connect",
    label: "Connect a live data source",
    desc: "Link Slack, GitHub, or Notion for real usage data",
    href: "/it-dashboard",
    cta: "Connect Tool",
  },
  {
    id: "recommendation",
    label: "Act on a recommendation",
    desc: "Mark at least one recommendation as In Progress",
    href: null,
    cta: null,
  },
  {
    id: "monitor",
    label: "Set up stack monitoring",
    desc: "Get monthly reports and renewal alerts",
    href: "/monitoring",
    cta: "Enable Monitoring",
  },
  {
    id: "contract",
    label: "Upload a contract",
    desc: "AI extracts key terms, renewal dates, and leverage",
    href: "/contracts",
    cta: "Go to Contracts",
  },
];

export default function OnboardingChecklist({ audits, recommendations, monitorReports, userActivity }) {
  const [collapsed, setCollapsed] = useState(false);

  const completedIds = new Set();
  if ((audits || []).some((a) => a.status === "completed")) completedIds.add("audit");
  if ((userActivity || []).some((u) => u.source === "live")) completedIds.add("connect");
  if ((recommendations || []).some((r) => r.status === "In Progress" || r.status === "Completed")) completedIds.add("recommendation");
  if ((monitorReports || []).length > 0) completedIds.add("monitor");

  const doneCount = completedIds.size;
  const totalCount = steps.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  // Hide once fully complete
  if (doneCount === totalCount) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm">Get the most out of Stack Sixth</p>
            <p className="text-xs text-muted-foreground">{doneCount} of {totalCount} steps complete · {pct}% there</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-primary">{pct}%</span>
          </div>
          {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t border-border/60 divide-y divide-border/40">
          {steps.map((step) => {
            const done = completedIds.has(step.id);
            return (
              <div key={step.id} className={`flex items-center gap-4 px-5 py-3.5 ${done ? "opacity-60" : ""}`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${done ? "line-through text-muted-foreground" : ""}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                {!done && step.href && (
                  <Link
                    to={step.href}
                    className="flex-shrink-0 text-xs font-semibold text-primary hover:underline"
                  >
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