import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Sparkles, AlertCircle, Plus, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import ActionCenter from "@/components/dashboard/ActionCenter";
import SpendSummaryBar from "@/components/dashboard/SpendSummaryBar";
import SpendByCategoryChart from "@/components/dashboard/SpendByCategoryChart";
import MonthlySpendTrendChart from "@/components/dashboard/MonthlySpendTrendChart";
import QuickScan from "@/components/dashboard/QuickScan";
import SavingsScoreboard from "@/components/dashboard/SavingsScoreboard";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import RenewalTimeline from "@/components/dashboard/RenewalTimeline";
import SpendHistoryChart from "@/components/dashboard/SpendHistoryChart";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function Dashboard() {
  const { user } = useAuth();

  const { data: audits, isError: auditsError } = useQuery({
    queryKey: ["audits-summary", user?.id],
    queryFn: () => base44.entities.SoftwareAudit.filter({ created_by_id: user?.id }, "-created_date", 50),
    enabled: !!user?.id,
  });

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations-dash", user?.id],
    queryFn: () => base44.entities.Recommendation.filter({ created_by_id: user?.id }, "-created_date", 100),
    enabled: !!user?.id,
  });

  const { data: monitorReports } = useQuery({
    queryKey: ["monitor-reports-dash", user?.id],
    queryFn: () => base44.entities.ToolMonitor.filter({ created_by_id: user?.id }, "-created_date", 50),
    enabled: !!user?.id,
  });

  const { data: userActivity } = useQuery({
    queryKey: ["user-activity-dash", user?.id],
    queryFn: () => base44.entities.UserActivity.filter({ created_by_id: user?.id }, "-updated_date", 20),
    enabled: !!user?.id,
  });

  const { data: contracts } = useQuery({
    queryKey: ["contracts-dash", user?.id],
    queryFn: () => base44.entities.Contract.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations-dash", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const completedAudits = audits?.filter((a) => a.status === "completed") || [];
  const hasData = completedAudits.length > 0;

  if (auditsError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="font-semibold">Failed to load your data</p>
        <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
      </div>
    );
  }

  // ── Empty state (new user) ──────────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="space-y-10">
        <motion.section {...fade()} className="text-center max-w-2xl mx-auto pt-12 relative">
          {/* Hero glow */}
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-64 rounded-full bg-primary/10 blur-3xl -z-10" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card text-xs font-semibold text-primary mb-7 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered SaaS Spend Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5">
            Take charge of your{" "}
            <span className="text-gradient">software spend</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            SMBs waste <strong className="text-foreground font-semibold">30–40%</strong> of their SaaS budget on duplicate tools, idle licenses, and overpriced plans.
            Stack Sixth finds it — in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/audit">
              <Button size="lg" className="gap-2 text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/25 btn-glow w-full sm:w-auto active:scale-[0.97]">
                Start Free Audit
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/audit?type=optimize">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12 rounded-xl glass-card hover:bg-white/80 dark:hover:bg-white/8 w-full sm:w-auto active:scale-[0.97] border-border/60">
                Optimize Existing Stack
              </Button>
            </Link>
          </div>

          {/* Quick Scan */}
          <div className="text-left mb-8">
            <QuickScan />
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { emoji: "🔍", title: "Find wasted spend", desc: "Duplicate tools, idle licenses, overpriced plans — all surfaced automatically." },
              { emoji: "💡", title: "Get a savings plan", desc: "AI ranks your biggest opportunities with estimated monthly savings." },
              { emoji: "📈", title: "Track & act", desc: "Assign actions, monitor renewals, and measure savings over time." },
            ].map(({ emoji, title, desc }, i) => (
              <motion.div key={title} {...fade(0.1 + i * 0.06)} className="glass-card hover-lift p-5 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4 text-lg">
                  {emoji}
                </div>
                <p className="font-semibold text-sm mb-1.5">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    );
  }

  // ── Returning user: Command Center ──────────────────────────────────────────
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const openRecs = (recommendations || []).filter((r) => r.status === "Open");
  const totalSavings = openRecs.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);
  // Use the most recent audit as the source of truth to avoid double-counting
  const latestAudit = completedAudits[0];
  const totalSpend = latestAudit?.monthly_budget || 0;
  const totalTools = latestAudit?.existing_software?.length || 0;
  const urgentRenewals = (monitorReports || []).flatMap((r) =>
    (r.tools_snapshot || []).filter((t) => {
      if (!t.renewal_date) return false;
      const days = Math.ceil((new Date(t.renewal_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    })
  );

  return (
    <div className="space-y-8">
      {/* Hero command center */}
      <motion.div {...fade()} className="relative">
        {/* Radial hero glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-56 rounded-full bg-primary/8 blur-3xl -z-10 dark:bg-primary/12" />

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-1">Command Center</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Good {getTimeOfDay()}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">Your stack health at a glance.</p>
          </div>
          <Link to="/audit">
            <Button className="gap-2 flex-shrink-0 shadow-md shadow-primary/20 btn-glow active:scale-[0.97]" size="sm">
              <Plus className="w-4 h-4" />
              New Audit
            </Button>
          </Link>
        </div>

        {/* Live coverage nudge — shown when activity data is mostly estimated */}
        {(() => {
          const liveCount = [...new Set((userActivity || []).filter((a) => a.source === "live").map((a) => a.tool_name))].length;
          const totalCount = [...new Set((userActivity || []).map((a) => a.tool_name))].length;
          const pct = totalCount > 0 ? Math.round((liveCount / totalCount) * 100) : 0;
          if (pct >= 80 || totalCount === 0) return null;
          return (
            <div className="mb-5 glass-card border-primary/20 bg-primary/5 flex items-center gap-3 px-4 py-3 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">
                  {pct}% live data coverage — connect more tools for accurate savings numbers
                </p>
                <p className="text-[11px] text-muted-foreground">Your recommendations are {pct < 40 ? "mostly" : "partly"} based on estimates.</p>
              </div>
              <Link to="/data-coverage" className="flex-shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5 text-xs">
                  Improve Coverage <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          );
        })()}

        {/* Big 4 KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Monthly Spend */}
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-3 h-3 text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Monthly Spend</p>
            </div>
            <p className="text-2xl font-extrabold font-mono tabular-nums">${totalSpend.toLocaleString()}</p>
          </div>

          {/* Savings Found */}
          <div className={`stat-card ${totalSavings > 0 ? "border-emerald-300/50 dark:border-emerald-600/30" : ""}`}
            style={totalSavings > 0 ? { background: 'rgba(16,185,129,0.07)' } : {}}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Savings Found</p>
            </div>
            <p className={`text-2xl font-extrabold font-mono tabular-nums ${totalSavings > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
              ${totalSavings.toLocaleString()}<span className="text-sm font-semibold">/mo</span>
            </p>
          </div>

          {/* Tools Tracked */}
          <div className="stat-card">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-violet-500/12 flex items-center justify-center">
                <Zap className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Tools Tracked</p>
            </div>
            <p className="text-2xl font-extrabold font-mono tabular-nums">{totalTools}</p>
          </div>

          {/* Renewals Due */}
          <div className={`stat-card ${urgentRenewals.length > 0 ? "border-amber-300/50 dark:border-amber-600/30" : ""}`}
            style={urgentRenewals.length > 0 ? { background: 'rgba(245,158,11,0.07)' } : {}}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Renewals Due</p>
            </div>
            <p className={`text-2xl font-extrabold font-mono tabular-nums ${urgentRenewals.length > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
              {urgentRenewals.length}
            </p>
            <p className="text-[10px] text-muted-foreground">next 30 days</p>
          </div>
        </div>
      </motion.div>

      {/* Onboarding checklist — shown until all steps done or dismissed */}
      <motion.div {...fade(0.08)}>
        <OnboardingChecklist
          audits={audits}
          recommendations={recommendations}
          monitorReports={monitorReports}
          userActivity={userActivity}
          contracts={contracts}
        />
      </motion.div>

      {/* Action Queue + Renewal Timeline side by side on larger screens */}
      <motion.div {...fade(0.12)} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ActionCenter
            audits={completedAudits}
            recommendations={recommendations}
            monitorReports={monitorReports}
          />
        </div>
        <div className="lg:col-span-2">
          <RenewalTimeline monitorReports={monitorReports} contracts={contracts} />
        </div>
      </motion.div>

      {/* Recent Audits */}
      <motion.div {...fade(0.15)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold tracking-tight">Recent Audits</h2>
          <Link to="/history" className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {completedAudits.slice(0, 3).map((audit, i) => {
            const savings = audit.analysis_result?.recommendations?.reduce(
              (s, r) => s + (r.estimated_savings_opportunity || 0), 0
            ) || 0;
            return (
              <motion.div key={audit.id} {...fade(0.15 + i * 0.04)}>
                <Link
                  to={`/results/${audit.id}`}
                  className="flex items-center justify-between glass-card hover-lift rounded-xl px-5 py-3.5 hover:border-primary/25 active:scale-[0.99] group block"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{audit.company_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {audit.existing_software?.length || 0} tools · {audit.team_size} people
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {savings > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40 px-2.5 py-0.5 rounded-full">
                        ${savings.toLocaleString()}/mo
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Charts */}
      {completedAudits.length > 1 && (
        <motion.div {...fade(0.2)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MonthlySpendTrendChart audits={completedAudits} />
          <SpendByCategoryChart audits={completedAudits} />
        </motion.div>
      )}
      {completedAudits.length === 1 && (
        <motion.div {...fade(0.2)}>
          <SpendByCategoryChart audits={completedAudits} />
        </motion.div>
      )}

      {/* Spend History — data moat */}
      <motion.div {...fade(0.22)}>
        <SpendHistoryChart integrations={integrations} userActivity={userActivity || []} />
      </motion.div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}