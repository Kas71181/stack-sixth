import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Sparkles, AlertCircle, Plus, TrendingUp, Zap, RefreshCw, Plug, DollarSign, TrendingDown, AlertTriangle, Activity, Lightbulb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";
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

  const { data: recommendations = [] } = useQuery({
    queryKey: ["recommendations-dash", user?.id],
    queryFn: () => base44.entities.Recommendation.filter({ created_by_id: user?.id }, "-created_date", 100),
    enabled: !!user?.id,
  });

  const { data: monitorReports = [] } = useQuery({
    queryKey: ["monitor-reports-dash", user?.id],
    queryFn: () => base44.entities.ToolMonitor.filter({ created_by_id: user?.id }, "-created_date", 50),
    enabled: !!user?.id,
  });

  const { data: userActivity = [] } = useQuery({
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

  // ── Returning user: Command Center ──────────────────────────────────────────
  const firstName = user?.full_name?.split(" ")[0] || "there";
  const trustedSummary = evidenceAnalytics?.summary || {};
  const totalMonthlySpend = trustedSummary.costsNeedReview ? 0 : trustedSummary.currentMonthlySpend || 0;
  const totalApps = trustedSummary.totalApplications || 0;
  const trustedRecommendations = recommendations.filter((r) => r.status === "Open" && r.validation_status === "valid");
  const openRecs = trustedRecommendations;
  const potentialSavings = trustedSummary.verifiedSavings || 0;
  const dormantSeats = trustedSummary.dormantSeats || 0;
  const activeTools = trustedSummary.verifiedUsageApplications || 0;

  // Renewals within 30 days
  const urgentRenewals = contracts.filter((c) => {
    if (!c.renewal_date || c.status === "Cancelled" || c.needs_confirmation === true || c.renewal_source === "inferred") return false;
    const d = Math.ceil((new Date(c.renewal_date) - new Date()) / 86400000);
    return d >= 0 && d <= 30;
  });

  return (
    <div className="space-y-7">
      {/* Daily Pulse */}
      <DailyPulse
        pendingRequests={purchaseRequests}
        urgentRenewals={urgentRenewals}
        verifiedSavings={potentialSavings}
        dormantToolCount={dormantSeats}
        isLoading={false}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-[0.1em] mb-1">Command Center</p>
          <h1 className="text-2xl sm:text-[2rem] font-extrabold tracking-tight">Good {getTimeOfDay()}, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your software stack.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/my-stack?tab=connect"><Button variant="outline" size="sm" className="gap-2"><Plug className="w-3.5 h-3.5" />Connect Data</Button></Link>
          <Link to="/audit"><Button size="sm" className="gap-2"><Plus className="w-3.5 h-3.5" />New Audit</Button></Link>
        </div>
      </div>

      {/* Evidence foundation */}
      <EvidenceSummaryStrip />

      {/* KPIs + Score */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Monthly Spend" value={totalMonthlySpend ? `$${Math.round(totalMonthlySpend).toLocaleString()}` : "—"} sub={totalMonthlySpend ? `${totalApps} apps` : "No financial evidence"} icon={DollarSign} color="blue" />
        <KpiCard label="Verified Savings" value={potentialSavings ? `$${Math.round(potentialSavings).toLocaleString()}` : "$0"} sub="per month identified" icon={TrendingDown} color="emerald" />
        <KpiCard label="Wasted Licenses" value={dormantSeats} sub={dormantSeats ? "verified dormant seats" : "No verified dormancy"} icon={AlertTriangle} color="amber" />
        <KpiCard label="Active Tools" value={activeTools || "—"} sub={activeTools ? "with verified live usage" : "No live usage evidence"} icon={Activity} color="violet" />
        <div className="col-span-2 lg:col-span-1 min-w-0">
          <StackScore totalSpend={totalMonthlySpend} totalSavings={potentialSavings} totalTools={totalApps} dormantTools={Array.from({ length: trustedSummary.dormantApplications || 0 })} urgentRenewals={urgentRenewals} openRecs={openRecs} userActivity={[]} inventoryTools={integrations} />
        </div>
      </div>

      {/* Action Center + Renewal Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card p-5">
          <ActionCenter
            audits={completedAudits}
            recommendations={trustedRecommendations}
            monitorReports={monitorReports}
          />
        </div>
        <div className="glass-card p-5">
          <RenewalTimeline contracts={contracts} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent audits */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Recent Audits</h2>
            <Link to="/history" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {completedAudits.slice(0, 4).map((audit) => (
              <Link key={audit.id} to={`/results/${audit.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/4 dark:hover:bg-white/4 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{audit.company_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(audit.created_date), "MMM d, yyyy")} · {audit.existing_software?.length || 0} tools</p>
                </div>
                <div className="flex items-center gap-3">
                  {audit.audit_score && <span className="text-xs font-mono font-bold text-primary">{audit.audit_score}/100</span>}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
            {completedAudits.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No completed audits yet</p>}
          </div>
        </div>

        {/* Recent recommendations */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />Top Opportunities</h2>
            <Link to="/savings?view=recommendations" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {openRecs.slice(0, 4).map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/4 dark:hover:bg-white/4 transition-colors">
                <div className="min-w-0 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rec.priority === "High" ? "bg-red-500" : rec.priority === "Medium" ? "bg-amber-500" : "bg-blue-500"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{rec.tool_name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{rec.description}</p>
                  </div>
                </div>
                {rec.estimated_monthly_savings > 0 && <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2">${Math.round(rec.estimated_monthly_savings)}/mo</span>}
              </div>
            ))}
            {openRecs.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No open opportunities</p>}
          </div>
        </div>
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

function KpiCard({ label, value, sub, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };
  return (
    <div className="stat-card hover-lift">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-mono font-bold mt-2">{value}</p>
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}