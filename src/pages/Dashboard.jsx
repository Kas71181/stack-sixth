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

  // ── Returning user: Action Center ───────────────────────────────────────────
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const openRecs = (recommendations || []).filter((r) => r.status === "Open");
  const totalSavings = openRecs.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div {...fade()}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Good {getTimeOfDay()}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {openRecs.length > 0
                ? `You have ${openRecs.length} open recommendation${openRecs.length > 1 ? "s" : ""} — $${totalSavings.toLocaleString()}/mo in potential savings.`
                : "Your software stack is up to date. Run a new audit anytime."}
            </p>
          </div>
          <Link to="/audit">
            <Button className="gap-2 flex-shrink-0" size="sm">
              <Plus className="w-4 h-4" />
              New Audit
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Savings Scoreboard */}
      <motion.div {...fade(0.05)}>
        <SavingsScoreboard recommendations={recommendations} audits={completedAudits} />
      </motion.div>

      {/* Onboarding Checklist */}
      <motion.div {...fade(0.07)}>
        <OnboardingChecklist
          audits={completedAudits}
          recommendations={recommendations}
          monitorReports={monitorReports}
          userActivity={userActivity}
        />
      </motion.div>

      {/* Spend Summary */}
      <motion.div {...fade(0.1)}>
        <SpendSummaryBar audits={completedAudits} recommendations={recommendations} />
      </motion.div>

      {/* Action Queue */}
      <motion.div {...fade(0.15)}>
        <ActionCenter
          audits={completedAudits}
          recommendations={recommendations}
          monitorReports={monitorReports}
        />
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
                className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-5 py-3.5 hover:shadow-md hover:border-primary/20 transition-all group"
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