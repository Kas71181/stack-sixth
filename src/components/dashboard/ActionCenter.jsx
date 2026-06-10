import { Link } from "react-router-dom";

import { TrendingDown, AlertTriangle, RefreshCw, Activity, ChevronRight, DollarSign, Zap } from "lucide-react";

function ActionItem({ icon: Icon, iconColor, iconBg, title, subtitle, cta, href, state, urgent }) {
  return (
    <Link
      to={href}
      state={state}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] group ${
        urgent
          ? "bg-amber-50/80 backdrop-blur-sm border-amber-200/70 hover:border-amber-300 hover:shadow-amber-100"
          : "bg-card/80 backdrop-blur-sm border-border/60 hover:border-primary/30 hover:shadow-primary/5"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          urgent
            ? "bg-amber-100 text-amber-800"
            : "bg-primary/10 text-primary"
        }`}>{cta}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

export default function ActionCenter({ audits, recommendations, monitorReports }) {
  const openRecs = recommendations?.filter((r) => r.status === "Open") || [];
  const highPriorityRecs = openRecs.filter((r) => r.priority === "High");
  const totalSavings = openRecs.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);
  const upcomingRenewals = monitorReports?.filter((r) => {
    const tools = r.tools_snapshot || [];
    return tools.some((t) => {
      if (!t.renewal_date) return false;
      const days = Math.ceil((new Date(t.renewal_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    });
  }) || [];

  const actions = [];

  if (highPriorityRecs.length > 0) {
    actions.push({
      icon: TrendingDown,
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
      title: `${highPriorityRecs.length} high-priority saving${highPriorityRecs.length > 1 ? "s" : ""} ready`,
      subtitle: `Act now to save $${highPriorityRecs.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0).toLocaleString()}/mo`,
      cta: "Review",
      href: "/it-dashboard",
      urgent: true,
    });
  }

  if (upcomingRenewals.length > 0) {
    actions.push({
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      title: `${upcomingRenewals.length} contract renewal${upcomingRenewals.length > 1 ? "s" : ""} in the next 30 days`,
      subtitle: "Review before auto-renewal to avoid surprise charges",
      cta: "View",
      href: "/monitoring",
      urgent: true,
    });
  }

  if (openRecs.length > 0 && totalSavings > 0) {
    actions.push({
      icon: DollarSign,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      title: `$${totalSavings.toLocaleString()}/mo in identified savings`,
      subtitle: `${openRecs.length} open recommendation${openRecs.length > 1 ? "s" : ""} waiting to be actioned`,
      cta: "Action",
      href: "/it-dashboard",
    });
  }

  if (audits.length > 0) {
    actions.push({
      icon: Activity,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      title: "Check live usage data",
      subtitle: "Connect tools to see who's actually using what",
      cta: "Connect",
      href: "/it-dashboard",
      state: { tab: "usage" },
    });
  }

  // Only show "Run a new audit" if there are no urgent items to avoid noise
  const hasUrgent = actions.some((a) => a.urgent);
  if (!hasUrgent) {
    actions.push({
      icon: RefreshCw,
      iconColor: "text-primary",
      iconBg: "bg-accent",
      title: "Run a new audit",
      subtitle: "Analyze your latest software stack for new savings",
      cta: "Start",
      href: "/audit",
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Your Action Queue
        </h2>
        {openRecs.length > 0 && (
          <span className="text-xs text-muted-foreground">{openRecs.length} open items</span>
        )}
      </div>
      {actions.map((a, i) => (
        <ActionItem key={i} {...a} />
      ))}
    </div>
  );
}