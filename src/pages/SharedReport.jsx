import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Users, DollarSign, Zap, CheckCircle2, ArrowRight, Star, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { sanitizeAiContent } from "@/lib/textFormatting";

const fade = (delay = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay } });

export default function SharedReport() {
  const id = new URLSearchParams(window.location.search).get("id");

  const { data: audit, isLoading, error } = useQuery({
    queryKey: ["shared-audit", id],
    queryFn: () => base44.entities.SoftwareAudit.get(id),
    enabled: !!id,
    retry: false,
  });

  if (!id) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">No report ID provided.</p></div>;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error || !audit || audit.status !== "completed") return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="font-semibold text-lg">Report not found</p>
        <p className="text-muted-foreground text-sm mt-1">This report may be private or no longer available.</p>
      </div>
    </div>
  );

  const result = sanitizeAiContent(audit.analysis_result || {});
  const recs = result.recommendations || [];
  const totalSavings = recs.reduce((s, r) => s + (r.estimated_savings_opportunity || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">S6</span>
            </div>
            <span className="font-bold text-sm">Stack Sixth</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Read-only report</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Company header */}
        <motion.div {...fade(0)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <Building2 className="w-7 h-7 text-primary" />
                {audit.company_name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{audit.team_size} people</span>
                {audit.monthly_budget && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />${audit.monthly_budget.toLocaleString()}/mo budget</span>}
                <span className="capitalize">{audit.user_type} stage</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-emerald-600 tabular-nums">${totalSavings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">potential monthly savings</p>
            </div>
          </div>
        </motion.div>

        {/* Summary */}
        {result.summary && (
          <motion.div {...fade(0.05)} className="glass-card p-5">
            <p className="text-sm leading-relaxed">{result.summary}</p>
          </motion.div>
        )}

        {/* KPI strip */}
        <motion.div {...fade(0.1)} className="grid grid-cols-3 gap-4">
          {[
            { label: "Tools Analyzed", value: audit.existing_software?.length || 0, icon: Zap, color: "text-primary" },
            { label: "Recommendations", value: recs.length, icon: Star, color: "text-amber-600" },
            { label: "Savings Identified", value: `$${totalSavings.toLocaleString()}/mo`, icon: TrendingDown, color: "text-emerald-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <p className={`text-2xl font-extrabold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Quick wins */}
        {result.quick_wins?.length > 0 && (
          <motion.div {...fade(0.15)} className="glass-card p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-primary" /> Quick Wins</h3>
            <ul className="space-y-2">
              {result.quick_wins.map((w, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {w}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Recommendations (read-only) */}
        <motion.div {...fade(0.2)}>
          <h2 className="text-lg font-bold mb-4">Recommendations</h2>
          <div className="space-y-3">
            {recs.map((rec, i) => (
              <div key={i} className="glass-card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary text-sm">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{rec.name}</h3>
                        <p className="text-xs text-muted-foreground">{rec.category}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {rec.estimated_monthly_cost != null && (
                          <span className="text-sm font-mono font-semibold">${rec.estimated_monthly_cost}/mo</span>
                        )}
                        {rec.estimated_savings_opportunity > 0 && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                            Save ${rec.estimated_savings_opportunity}/mo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs"><Star className="w-3 h-3 text-primary fill-primary" />{rec.match_score}% match</span>
                      {rec.replacement_candidate_for && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowRight className="w-3 h-3" />Replaces {rec.replacement_candidate_for}</span>
                      )}
                    </div>
                    {rec.savings_or_roi_note && (
                      <p className="text-xs text-primary mt-2 bg-primary/5 rounded-lg px-3 py-1.5">{rec.savings_or_roi_note}</p>
                    )}
                    {rec.why_it_fits?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {rec.why_it_fits.slice(0, 2).map((w, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />{w}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="text-center py-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground">Generated by <strong>Stack Sixth</strong>, AI-powered SaaS spend optimization</p>
          <a href="/" className="mt-2 inline-block text-xs text-primary hover:underline">Run your own audit →</a>
        </div>
      </div>
    </div>
  );
}