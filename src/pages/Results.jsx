import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Building2, Users, Info, Zap } from "lucide-react";
import { motion } from "framer-motion";
import BudgetSummary from "../components/results/BudgetSummary";
import ROISimulator from "../components/results/ROISimulator";
import RecommendationCard from "../components/results/RecommendationCard";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function Results() {
  const { id } = useParams();
  const { data: audit, isLoading } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => base44.entities.SoftwareAudit.get(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground">Audit not found.</p>
        <Link to="/" className="text-primary text-sm underline mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const result = audit.analysis_result || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fade()}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {audit.company_name}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {audit.team_size} people
              </span>
              <span className="capitalize">{audit.user_type}</span>
              {audit.monthly_budget && <span>${audit.monthly_budget.toLocaleString()}/mo budget</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      {result.summary && (
        <motion.div {...fade(0.05)} className="bg-card border border-border/60 rounded-2xl p-5">
          <p className="text-sm leading-relaxed">{result.summary}</p>
        </motion.div>
      )}

      {/* Budget Summary */}
      <motion.div {...fade(0.1)}>
        <BudgetSummary result={result} audit={audit} />
      </motion.div>

      {/* Quick Wins */}
      {result.quick_wins?.length > 0 && (
        <motion.div {...fade(0.15)} className="bg-accent/50 border border-primary/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            Quick Wins
          </h3>
          <ul className="space-y-2">
            {result.quick_wins.map((w, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {w}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Recommendations */}
      <motion.div {...fade(0.2)}>
        <h2 className="text-lg font-semibold mb-3">Recommendations</h2>
        <div className="space-y-3">
          {result.recommendations?.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} index={i} />
          ))}
        </div>
      </motion.div>

      {/* ROI Simulator */}
      {result.recommendations?.some((r) => r.estimated_savings_opportunity > 0) && (
        <motion.div {...fade(0.28)}>
          <ROISimulator recommendations={result.recommendations} />
        </motion.div>
      )}

      {/* Assumptions */}
      {result.assumptions?.length > 0 && (
        <motion.div {...fade(0.25)} className="bg-muted/50 rounded-2xl p-5">
          <h3 className="text-xs font-semibold flex items-center gap-2 mb-2 text-muted-foreground uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            Assumptions Made
          </h3>
          <ul className="space-y-1">
            {result.assumptions.map((a, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {a}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}