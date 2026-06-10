import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Sparkles, AlertCircle, Plus } from "lucide-react";
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
        <motion.section {...fade()} className="text-center max-w-2xl mx-auto pt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
            <BarChart3 className="w-3.5 h-3.5" />
            AI-Powered SaaS Spend Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Take charge of your{" "}
            <span className="text-primary">software spend</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            SMBs waste <strong className="text-foreground">30–40%</strong> of their SaaS budget on duplicate tools, idle licenses, and overpriced plans.
            Stack Sixth finds it and helps you fix it — in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/audit">
              <Button size="lg" className="gap-2 text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/20 w-full sm:w-auto">
                Start Free Audit
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/audit?type=optimize">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 h-12 rounded-xl w-full sm:w-auto">
                Optimize Existing Stack
              </Button>
            </Link>
          </div>

          {/* Quick Scan */}
          <div className="text-left mb-6">
            <QuickScan />
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { emoji: "🔍", title: "Find wasted spend", desc: "Duplicate tools, idle licenses, overpriced plans — all surfaced automatically." },
              { emoji: "💡", title: "Get a savings plan", desc: "AI ranks your biggest opportunities with estimated monthly savings." },
              { emoji: "📈", title: "Track & act", desc: "Assign actions, monitor renewals, and measure savings over time." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-card border border-border/60 rounded-2xl p-5">
                <p className="text-2xl mb-3">{emoji}</p>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
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
  const totalSpend = completedAudits.reduce((s, a) => s + (a.monthly_budget || 0), 0);
  const totalTools = completedAudits.reduce((s, a) => s + (a.existing_software?.length || 0), 0);
  const urgentRenewals = (monitorReports || []).flatMap((r) =>
    (r.tools_snapshot || []).filter((t) => {
      if (!t.renewal_date) return false;
      const days = Math.ceil((new Date(t.renewal_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 30;
    })
  );

  return (
    <div className="space-y-8">
      {/* Hero command center row */}
      <motion.div {...fade()}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Good {getTimeOfDay()}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Here's the health of your stack right now.</p>
          </div>
          <Link to="/audit">
            <Button className="gap-2 flex-shrink-0" size="sm">
              <Plus className="w-4 h-4" />
              New Audit
            </Button>
          </Link>
        </div>

        {/* Big 4 stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card hover-lift rounded-2xl p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Spend</p>
            <p className="text-2xl font-extrabold">${totalSpend.toLocaleString()}</p>
          </div>
          <div className={`glass-card hover-lift rounded-2xl p-4 flex flex-col gap-1 ${totalSavings > 0 ? "bg-emerald-50/80 border-emerald-200/60" : ""}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Savings Found</p>
            <p className={`text-2xl font-extrabold ${totalSavings > 0 ? "text-emerald-700" : ""}`}>
              ${totalSavings.toLocaleString()}<span className="text-sm font-semibold">/mo</span>
            </p>
          </div>
          <div className="glass-card hover-lift rounded-2xl p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Tools Tracked</p>
            <p className="text-2xl font-extrabold">{totalTools}</p>
          </div>
          <div className={`glass-card hover-lift rounded-2xl p-4 flex flex-col gap-1 ${urgentRenewals.length > 0 ? "bg-amber-50/80 border-amber-200/60" : ""}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Renewals Due</p>
            <p className={`text-2xl font-extrabold ${urgentRenewals.length > 0 ? "text-amber-700" : ""}`}>{urgentRenewals.length}</p>
            <p className="text-[10px] text-muted-foreground">in next 30 days</p>
          </div>
        </div>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Recent Audits</h2>
          <Link to="/history" className="text-sm text-primary font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {completedAudits.slice(0, 3).map((audit) => {
            const savings = audit.analysis_result?.recommendations?.reduce(
              (s, r) => s + (r.estimated_savings_opportunity || 0), 0
            ) || 0;
            return (
              <Link
                key={audit.id}
                to={`/results/${audit.id}`}
                className="flex items-center justify-between glass-card hover-lift rounded-xl px-5 py-3.5 hover:border-primary/20 active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{audit.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {audit.existing_software?.length || 0} tools · {audit.team_size} people
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {savings > 0 && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ${savings.toLocaleString()}/mo savings
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
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
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}