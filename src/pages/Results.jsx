import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Building2, Users, Info, Zap, Globe, Target, LayoutList, Columns2, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import BudgetSummary from "../components/results/BudgetSummary";
import ROISimulator from "../components/results/ROISimulator";
import RecommendationCard from "../components/results/RecommendationCard";
import ComparisonView from "../components/results/ComparisonView";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function Results() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: audit, isLoading } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => base44.entities.SoftwareAudit.get(id),
    enabled: !!user,
  });

  const [viewMode, setViewMode] = useState("list");
  const [groupByCategory, setGroupByCategory] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Block access if audit doesn't belong to the current user
  if (!audit || (audit.created_by && audit.created_by !== user?.email)) {
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground font-medium">Access denied.</p>
        <p className="text-sm text-muted-foreground mt-1">This audit does not belong to your account.</p>
        <Link to="/" className="text-primary text-sm underline mt-3 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  const result = audit.analysis_result || {};
  const icp = audit.icp_profile;

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

      {/* ICP Profile */}
      {icp && (
        <motion.div {...fade(0.04)} className="bg-gradient-to-r from-primary/5 to-accent/30 border border-primary/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold">Company ICP Detected</h3>
            {audit.company_website && (
              <a href={audit.company_website} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">
                <Globe className="w-3 h-3" />
                Source
              </a>
            )}
          </div>
          {icp.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{icp.summary}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {icp.industry && (
              <div className="bg-white/70 rounded-xl p-3 border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Industry</p>
                <p className="text-xs font-semibold">{icp.industry}</p>
              </div>
            )}
            {icp.business_model && (
              <div className="bg-white/70 rounded-xl p-3 border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Model</p>
                <p className="text-xs font-semibold">{icp.business_model}</p>
              </div>
            )}
            {icp.company_stage && (
              <div className="bg-white/70 rounded-xl p-3 border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stage</p>
                <p className="text-xs font-semibold capitalize">{icp.company_stage}</p>
              </div>
            )}
            {icp.tech_maturity && (
              <div className="bg-white/70 rounded-xl p-3 border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tech Maturity</p>
                <p className="text-xs font-semibold capitalize">{icp.tech_maturity}</p>
              </div>
            )}
          </div>
          {icp.key_use_cases?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {icp.key_use_cases.map((uc, i) => (
                <span key={i} className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium border border-primary/15">
                  {uc}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recommendations</h2>
          <div className="flex items-center gap-2">
            {viewMode === "list" && (
              <button
                onClick={() => setGroupByCategory(!groupByCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  groupByCategory ? "bg-primary/10 text-primary border-primary/20" : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                By Category
              </button>
            )}
          <div className="flex items-center gap-1 bg-muted/60 border border-border/60 rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "compare" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              Compare
            </button>
          </div>
          </div>
        </div>
        {viewMode === "list" ? (
          groupByCategory ? (
            (() => {
              const grouped = (result.recommendations || []).reduce((acc, rec) => {
                const cat = rec.category || "Other";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(rec);
                return acc;
              }, {});
              return (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([category, recs]) => (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{category}</h3>
                        <span className="text-xs text-muted-foreground">({recs.length})</span>
                      </div>
                      <div className="space-y-3">
                        {recs.map((rec, i) => (
                          <RecommendationCard key={i} rec={rec} index={result.recommendations.indexOf(rec)} auditName={audit.company_name} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="space-y-3">
              {result.recommendations?.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} index={i} auditName={audit.company_name} />
              ))}
            </div>
          )
        ) : (
          <ComparisonView
            recommendations={result.recommendations || []}
            auditName={audit.company_name}
            monthlyBudget={audit.monthly_budget}
          />
        )}
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