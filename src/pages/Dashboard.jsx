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
import RenewalTimeline from "@/components/dashboard/RenewalTimeline";
import SpendHistoryChart from "@/components/dashboard/SpendHistoryChart";
import DailyPulse from "@/components/dashboard/DailyPulse";
import StackScore from "@/components/dashboard/StackScore";
import PrivacyPolicyFooter from "@/components/dashboard/PrivacyPolicyFooter";
import EvidenceSummaryStrip from "@/components/evidence/EvidenceSummaryStrip";
import useEvidenceAnalytics from "@/hooks/useEvidenceAnalytics";
import InventorySummary from "@/components/dashboard/InventorySummary";
import UsageSummary from "@/components/dashboard/UsageSummary";
import OpportunitySummary from "@/components/dashboard/OpportunitySummary";
import NextActionsSummary from "@/components/dashboard/NextActionsSummary";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

export default function Dashboard() {
  const { user } = useAuth();
  const { data: evidenceAnalytics, isLoading: evidenceLoading } = useEvidenceAnalytics();

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
    queryFn: async () => {
      const [owned, company] = await Promise.all([
        base44.entities.UserActivity.filter({ created_by_id: user.id }),
        base44.entities.UserActivity.filter({ company_id: user.id }),
      ]);
      return [...new Map([...owned, ...company].map((activity) => [activity.id, activity])).values()];
    },
    enabled: !!user?.id,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts", user?.id],
    queryFn: () => base44.entities.Contract.filter({ created_by_id: user?.id }, "renewal_date", 50),
    enabled: !!user?.id,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations-dash", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: purchaseRequests = [] } = useQuery({
    queryKey: ["purchase-requests-dash", user?.id],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: "pending" }, "-created_date", 20),
    enabled: !!user?.id,
  });

  const completedAudits = audits?.filter((a) => a.status === "completed") || [];
  const hasData = completedAudits.length > 0 || (evidenceAnalytics?.summary?.totalApplications || 0) > 0;

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

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card text-xs font-semibold text-primary mb-8 border border-primary/15">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered SaaS Spend Management
          </div>
          <h1 className="text-[2.6rem] sm:text-[3.25rem] font-extrabold tracking-tight leading-[1.1] mb-5">
            Take charge of your{" "}
            <span className="text-gradient">software spend</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-[460px] mx-auto">
            SMBs waste <strong className="text-foreground font-semibold">30–40%</strong> of their SaaS budget on duplicate tools, idle licenses, and overpriced plans. Stack Sixth finds it — in minutes.
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
              <motion.div key={title} {...fade(0.1 + i * 0.06)} className="glass-card hover-lift p-5 group cursor-default border border-border/60">
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center mb-4 text-lg">
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

  // ── Returning user: trusted decision overview ───────────────────────────────
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const summary = evidenceAnalytics?.summary;
  if (!summary) return <div className="skeleton h-72 rounded-2xl" />;
  const urgentRenewals = contracts.filter((contract) => {
    if (!contract.renewal_date || contract.status === "Cancelled" || contract.needs_confirmation === true || contract.renewal_source === "inferred") return false;
    const days = Math.ceil((new Date(contract.renewal_date) - new Date()) / 86400000);
    return days >= 0 && days <= 30;
  });

  return (
    <div className="space-y-7">
      <DailyPulse pendingRequests={purchaseRequests} urgentRenewals={urgentRenewals} verifiedSavings={summary.verifiedSavings || 0} dormantToolCount={summary.dormantApplications || 0} isLoading={evidenceLoading} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary/70">See · Understand · Decide · Act · Measure</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[2rem]">Good {getTimeOfDay()}, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Trusted evidence first. Unsupported metrics stay hidden.</p>
        </div>
        <Link to="/audit"><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Audit</Button></Link>
      </div>
      <EvidenceSummaryStrip />
      <div className="grid gap-5 lg:grid-cols-2">
        <InventorySummary summary={summary} contracts={contracts} upcomingRenewals={urgentRenewals} />
        <UsageSummary summary={summary} />
        <OpportunitySummary summary={summary} />
        <NextActionsSummary summary={summary} recommendations={recommendations} renewals={urgentRenewals} pendingRequests={purchaseRequests} />
      </div>
      <PrivacyPolicyFooter />
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}