import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, DollarSign, Layers, Zap, Search, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

const features = [
  {
    icon: Search,
    title: "Identify Wasted Spend",
    desc: "Detect duplicate tools, idle licenses, and overpriced plans draining your budget.",
  },
  {
    icon: TrendingDown,
    title: "Savings Engine",
    desc: "Get a ranked savings plan — redundant software, cheaper alternatives, and consolidation opportunities.",
  },
  {
    icon: RefreshCw,
    title: "Optimize & Track ROI",
    desc: "Implement your savings plan and track ROI. From insight → action → savings.",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: audits } = useQuery({
    queryKey: ["audits-summary", user?.email],
    queryFn: () => base44.entities.SoftwareAudit.filter({ created_by: user?.email }, "-created_date", 5),
    enabled: !!user?.email,
  });

  const completedAudits = audits?.filter((a) => a.status === "completed") || [];
  const totalSaved = completedAudits.reduce((sum, a) => {
    const result = a.analysis_result;
    if (!result?.recommendations) return sum;
    return (
      sum +
      result.recommendations.reduce(
        (s, r) => s + (r.estimated_savings_opportunity || 0),
        0
      )
    );
  }, 0);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.section {...fade()} className="text-center max-w-2xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
          <BarChart3 className="w-3.5 h-3.5" />
          AI CFO for Software Spend
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          Stop Wasting Money{" "}
          <span className="text-primary">on Software</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-3">
          SMBs waste <strong className="text-foreground">30–40% of their SaaS spend</strong> on duplicate tools, idle licenses, and overpriced plans. Stack Sixth identifies and eliminates that waste.
        </p>
        <p className="text-muted-foreground text-sm mb-8 italic">The sixth sense for software decisions.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
      </motion.section>

      {/* Stats */}
      {completedAudits.length > 0 && (
        <motion.section {...fade(0.15)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Audits Completed" value={completedAudits.length} />
          <StatCard
            label="Potential Monthly Savings"
            value={`$${totalSaved.toLocaleString()}`}
            highlight
          />
          <StatCard
            label="Tools Analyzed"
            value={completedAudits.reduce(
              (s, a) => s + (a.existing_software?.length || 0),
              0
            )}
          />
        </motion.section>
      )}

      {/* Features */}
      <motion.section {...fade(0.25)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="group bg-card border border-border/60 rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-base mb-1.5">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </motion.section>

      {/* Recent Audits */}
      {completedAudits.length > 0 && (
        <motion.section {...fade(0.35)}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Audits</h2>
            <Link
              to="/history"
              className="text-sm text-primary font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {completedAudits.slice(0, 3).map((audit) => (
              <Link
                key={audit.id}
                to={`/results/${audit.id}`}
                className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-5 py-4 hover:shadow-md transition-all group"
              >
                <div>
                  <p className="font-medium text-sm">{audit.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {audit.team_size} people · ${audit.monthly_budget?.toLocaleString()}/mo budget
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-5 border ${highlight ? "bg-primary/5 border-primary/20" : "bg-card border-border/60"}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}