import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, Building2, Users, Info, Zap, Globe, Target, LayoutList, Columns2, Tag, RefreshCw, Activity, Share2, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import BudgetSummary from "../components/results/BudgetSummary";
import ROISimulator from "../components/results/ROISimulator";
import RecommendationCard from "../components/results/RecommendationCard";
import ComparisonView from "../components/results/ComparisonView";
import ProjectedROICalculator from "../components/results/ProjectedROICalculator";
import ExportPptxButton from "../components/results/ExportPptxButton";
import DataConfidenceScore from "../components/results/DataConfidenceScore";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const SYSTEM_PROMPT = `You are Stack Sixth, an AI CFO for Software Spend.

Analyze the provided company context and return software recommendations optimized for savings, fit, and integration.

IMPORTANT:
- Return ONLY valid JSON.
- Do not include markdown, code fences, or extra text.

Rules:
1. Return 3 to 5 recommendations.
2. match_score must be between 0 and 100.
3. Do not recommend exact duplicates from existing_software unless replacement_candidate_for is set.
4. For startup users, bias toward essential low-friction tools.
5. For optimize users, bias toward integration, consolidation, and savings.
6. Keep recommendations practical and budget-aware.`;

export default function Results() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState("list");
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUpdateRec = async (index, updates) => {
    const recs = [...(audit.analysis_result?.recommendations || [])];
    recs[index] = { ...recs[index], ...updates };
    await base44.entities.SoftwareAudit.update(audit.id, {
      analysis_result: { ...audit.analysis_result, recommendations: recs },
    });
    queryClient.invalidateQueries({ queryKey: ["audit", id] });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/shared-report?id=${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      prompt("Copy this shareable link:", shareUrl);
      return;
    }
    base44.analytics.track({ eventName: "report_shared", properties: { audit_id: id } });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if this is a freshly completed audit
  const isNew = new URLSearchParams(window.location.search).get("new") === "1";
  const [showMonitorPrompt, setShowMonitorPrompt] = useState(isNew);

  const { data: audit, isLoading } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => base44.entities.SoftwareAudit.get(id),
    enabled: !!user,
    // Poll every 3s while the analysis is still running
    refetchInterval: (query) => query.state.data?.status === "pending" ? 3000 : false,
  });

  // Analytics + benchmark on first completed load
  useEffect(() => {
    if (!audit || audit.status !== "completed") return;
    const totalSavings = audit.analysis_result?.recommendations?.reduce((s, r) => s + (r.estimated_savings_opportunity || 0), 0) || 0;
    base44.analytics.track({ eventName: "results_viewed", properties: { audit_id: id, tool_count: audit.existing_software?.length || 0, total_savings: totalSavings, is_new: isNew } });
    if (audit.existing_software?.length > 0) {
      const sizeRange = audit.team_size <= 10 ? "1-10" : audit.team_size <= 50 ? "11-50" : audit.team_size <= 200 ? "51-200" : audit.team_size <= 500 ? "201-500" : "500+";
      base44.functions.invoke("submitBenchmark", {
        integrations: audit.existing_software.map((s) => ({ tool_name: s.name, category: s.category, monthly_cost: s.monthly_cost })),
        company_size: sizeRange,
      }).catch(() => {});
    }
  }, [audit?.id, audit?.status]);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryError(false);
    const input = {
      company_name: audit.company_name,
      user_type: audit.user_type,
      team_size: audit.team_size,
      monthly_budget: audit.monthly_budget || null,
      business_processes: audit.business_processes,
      pain_points: audit.pain_points,
      existing_software: audit.existing_software,
      icp_profile: audit.icp_profile || null,
    };
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${SYSTEM_PROMPT}\n\nInput:\n${JSON.stringify(input, null, 2)}`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          budget_fit: { type: "string" },
          suggested_stack_total: { type: "number" },
          quick_wins: { type: "array", items: { type: "string" } },
          assumptions: { type: "array", items: { type: "string" } },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                estimated_monthly_cost: { type: "number" },
                match_score: { type: "number" },
                why_it_fits: { type: "array", items: { type: "string" } },
                integration_notes: { type: "array", items: { type: "string" } },
                savings_or_roi_note: { type: "string" },
                implementation_priority: { type: "string" },
                adopt_now_or_later: { type: "string" },
                replacement_candidate_for: { type: "string" },
                estimated_savings_opportunity: { type: "number" },
                migration_risk: { type: "string" },
              },
            },
          },
        },
      },
    });
    try {
      await base44.entities.SoftwareAudit.update(audit.id, { analysis_result: result, status: "completed" });
      queryClient.invalidateQueries({ queryKey: ["audit", id] });
    } catch {
      setRetryError(true);
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (audit?.status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <div>
          <p className="font-bold text-lg">Analyzing your stack…</p>
          <p className="text-sm text-muted-foreground mt-1">Our AI is generating your recommendations. This usually takes 15–30 seconds.</p>
        </div>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground font-medium">Access denied.</p>
        <p className="text-sm text-muted-foreground mt-1">This audit does not belong to your account.</p>
        <Link to="/" className="text-primary text-sm underline mt-3 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  // Error state
  if (audit.status === "error") {
    return (
      <div className="max-w-2xl mx-auto text-center py-32">
        <p className="font-bold text-lg">Analysis failed</p>
        <p className="text-sm text-muted-foreground mt-1.5 mb-6">Something went wrong during the AI analysis. You can retry below.</p>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {retrying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {retrying ? "Retrying..." : "Retry Analysis"}
        </button>
        {retryError && (
          <p className="flex items-center gap-1.5 text-sm text-destructive mt-3">
            <AlertCircle className="w-4 h-4" />
            Retry failed. Please check your connection and try again.
          </p>
        )}
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                copied
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-card text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Link copied!" : "Share"}
            </button>
            <ExportPptxButton audit={audit} />
          </div>
        </div>
      </motion.div>

      {/* Viral share nudge — shown when total savings > $500/mo */}
      {(result.recommendations?.reduce((s, r) => s + (r.estimated_savings_opportunity || 0), 0) || 0) > 500 && !copied && (
        <motion.div {...fade(0.01)} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                You found ${(result.recommendations?.reduce((s, r) => s + (r.estimated_savings_opportunity || 0), 0) || 0).toLocaleString()}/mo in savings 🎉
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Share this read-only report with your CFO or finance team.</p>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex-shrink-0 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Share Report →
          </button>
        </motion.div>
      )}

      {/* Post-audit monitoring prompt */}
      {showMonitorPrompt && (
        <motion.div {...fade(0.02)} className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Enable continuous monitoring?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get monthly AI health reports on this stack automatically.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/monitoring"
              className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Set Up
            </Link>
            <button
              onClick={() => setShowMonitorPrompt(false)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

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

      {/* Data Confidence Score */}
      <motion.div {...fade(0.03)}>
        <DataConfidenceScore audit={audit} />
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
                          <RecommendationCard key={i} rec={rec} index={result.recommendations.indexOf(rec)} auditName={audit.company_name} onUpdate={handleUpdateRec} />
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
                <RecommendationCard key={i} rec={rec} index={i} auditName={audit.company_name} onUpdate={handleUpdateRec} />
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

      {/* Long-Term ROI Calculator */}
      {result.recommendations?.some((r) => r.estimated_savings_opportunity > 0) && (
        <motion.div {...fade(0.32)}>
          <ProjectedROICalculator
            recommendations={result.recommendations}
            currentBudget={audit.monthly_budget}
            teamSize={audit.team_size}
          />
        </motion.div>
      )}

      {/* Refresh Analysis nudge — bottom of page */}
      <motion.div {...fade(0.35)} className="glass-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Stack changed since this audit?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Re-run the analysis to get updated recommendations with your latest data.</p>
        </div>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border/60 bg-card text-sm font-medium hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50"
        >
          {retrying ? <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Refresh Analysis
        </button>
      </motion.div>

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