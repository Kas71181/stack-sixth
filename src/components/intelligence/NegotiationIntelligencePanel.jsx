import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy, Target, TrendingDown, MessageSquare, Swords, ChevronDown, ChevronUp, Award } from "lucide-react";

export default function NegotiationIntelligencePanel() {
  const [expandedVendor, setExpandedVendor] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["negotiation-intelligence"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getNegotiationIntelligence", {});
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="h-6 w-48 skeleton rounded-lg" />
        <div className="h-20 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-xl" />
      </div>
    );
  }

  if (!data?.success) return null;

  const { overall, vendors } = data;

  if (overall.total_negotiations === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-sm mb-1">No negotiation data yet</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Create negotiation playbooks from your contracts. Once outcomes are recorded, crowd-sourced vendor intelligence will appear here — including average discounts won, win rates, and proven talking points.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall stats */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Negotiation Intelligence</h3>
            <p className="text-[11px] text-muted-foreground">Crowd-sourced from all Stack Sixth negotiations</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Negotiations" value={overall.total_negotiations} icon={Target} />
          <StatTile
            label="Win Rate"
            value={overall.overall_win_rate != null ? `${overall.overall_win_rate}%` : "—"}
            icon={Trophy}
          />
          <StatTile
            label="Avg Discount Won"
            value={overall.avg_discount_won != null ? `${overall.avg_discount_won}%` : "—"}
            icon={TrendingDown}
          />
          <StatTile label="Vendors Tracked" value={overall.vendors_tracked} icon={Swords} />
        </div>
      </div>

      {/* Vendor breakdown */}
      <div className="glass-card rounded-2xl p-5">
        <h4 className="font-bold text-sm mb-3">Vendor Intelligence</h4>
        <div className="space-y-2">
          {vendors.map((v, i) => {
            const isExpanded = expandedVendor === v.vendor_name;
            return (
              <motion.div
                key={v.vendor_name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-subtle rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedVendor(isExpanded ? null : v.vendor_name)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/3 dark:hover:bg-white/4 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-primary">
                        {v.vendor_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{v.vendor_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {v.total_negotiations} negotiation{v.total_negotiations !== 1 ? "s" : ""}
                        {v.win_rate != null && ` · ${v.win_rate}% win rate`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {v.avg_actual_discount_pct != null && (
                      <span className="text-xs font-bold text-emerald-600">
                        -{v.avg_actual_discount_pct}% avg
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-4 pb-4 space-y-4 border-t border-border/40 pt-4"
                  >
                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <MiniStat label="Won" value={v.won} color="text-emerald-600" />
                      <MiniStat label="Lost" value={v.lost} color="text-red-500" />
                      <MiniStat label="In Progress" value={v.in_progress} color="text-amber-600" />
                      <MiniStat label="Pending" value={v.pending} color="text-muted-foreground" />
                    </div>

                    {v.avg_target_discount_pct != null && (
                      <div className="flex items-center gap-2 text-xs">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        <span className="text-muted-foreground">Target discount:</span>
                        <span className="font-bold">{v.avg_target_discount_pct}%</span>
                        {v.avg_walk_away_price != null && (
                          <>
                            <span className="text-muted-foreground ml-3">Walk-away:</span>
                            <span className="font-bold">${v.avg_walk_away_price}/mo</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Talking points */}
                    {v.top_talking_points.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <MessageSquare className="w-3.5 h-3.5 text-primary" />
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Proven Talking Points</p>
                        </div>
                        <div className="space-y-1.5">
                          {v.top_talking_points.map((tp, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                                {tp.count}
                              </span>
                              <span className="text-foreground/90 pt-0.5">{tp.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competitor alternatives */}
                    {v.top_competitor_alternatives.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Swords className="w-3.5 h-3.5 text-primary" />
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Leverage Alternatives</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {v.top_competitor_alternatives.map((alt, idx) => (
                            <span key={idx} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                              {alt.text} ({alt.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="glass-subtle rounded-xl p-3 text-center">
      <Icon className="w-4 h-4 mx-auto mb-1.5 text-primary" />
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="bg-muted/30 rounded-lg py-2">
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}