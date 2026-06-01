import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { DollarSign, AlertTriangle, Layers, ShieldCheck, TrendingDown, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/lib/AuthContext";
import { useWizardImport } from "@/hooks/useWizardImport";

const fade = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d } });

function ScoreRing({ score }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle cx="48" cy="48" r={r} stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-extrabold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function StackDashboard({ embedded = false }) {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations", user?.id],
    queryFn: () => base44.entities.SaasIntegration.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["companies", user?.id],
    queryFn: () => base44.entities.Company.filter({ created_by_id: user?.id }),
    enabled: !!user?.id,
  });
  const { data: auditReports = [] } = useQuery({
    queryKey: ["audit-reports", user?.id],
    queryFn: () => base44.entities.AuditReport.filter({ created_by_id: user?.id }, "-generated_date", 5),
    enabled: !!user?.id,
  });

  const { handleWizardComplete: _handleWizardComplete } = useWizardImport({ integrations, companies });
  const handleWizardComplete = async (data) => {
    await _handleWizardComplete(data);
    setShowWizard(false);
  };

  const company = companies[0];
  const totalSpend = integrations.reduce((s, i) => s + (i.monthly_cost || 0), 0);
  const totalWaste = integrations.reduce((s, i) => {
    const inactive = (i.licensed_seats || 0) - (i.active_users || 0);
    const costPerSeat = i.licensed_seats > 0 ? (i.monthly_cost || 0) / i.licensed_seats : 0;
    return s + Math.max(0, inactive * costPerSeat);
  }, 0);
  const latestAudit = auditReports[0];
  const auditScore = company?.audit_score ?? latestAudit?.audit_score ?? 0;

  // Spend by category
  const categoryMap = {};
  integrations.forEach((i) => {
    if (!categoryMap[i.category]) categoryMap[i.category] = 0;
    categoryMap[i.category] += i.monthly_cost || 0;
  });
  const categoryData = Object.entries(categoryMap).map(([cat, cost]) => ({ cat: cat.replace(" & ", " &\n"), cost })).sort((a, b) => b.cost - a.cost);

  // Top wasted
  const wastedTools = integrations.map((i) => {
    const inactive = (i.licensed_seats || 0) - (i.active_users || 0);
    const costPerSeat = i.licensed_seats > 0 ? (i.monthly_cost || 0) / i.licensed_seats : 0;
    return { ...i, wasted: Math.max(0, inactive * costPerSeat) };
  }).sort((a, b) => b.wasted - a.wasted).slice(0, 5).filter(t => t.wasted > 0);

  const utilColor = (rate) => rate >= 70 ? "bg-emerald-500" : rate >= 40 ? "bg-amber-400" : "bg-red-500";
  const isEmpty = !isLoading && integrations.length === 0;

  return (
    <div className="space-y-6">
      {!embedded && (
        <motion.div {...fade()} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">SaaS Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{company?.name || "Your Company"} · {integrations.length} tools connected</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowWizard(true)} className="gap-1.5"><Zap className="w-3.5 h-3.5" />Auto-Import</Button>
        </motion.div>
      )}
      {embedded && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{company?.name || "Your Company"} · {integrations.length} tools connected</p>
          <Button size="sm" variant="outline" onClick={() => setShowWizard(true)} className="gap-1.5"><Zap className="w-3.5 h-3.5" />Auto-Import</Button>
        </div>
      )}

      {/* Empty state — prompt onboarding */}
      {isEmpty && (
        <motion.div {...fade(0.05)} className="bg-gradient-to-br from-primary/5 to-accent/20 border border-primary/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-1">Connect your SaaS stack</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">Import your tools automatically via Stripe, Google Workspace, or a CSV upload — no manual entry needed.</p>
          <Button onClick={() => setShowWizard(true)} className="gap-2">
            <Zap className="w-4 h-4" /> Start Auto-Import
          </Button>
        </motion.div>
      )}

      {/* Stats row */}
      <motion.div {...fade(0.05)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Spend", value: `$${totalSpend.toLocaleString()}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
          { label: "Monthly Waste", value: `$${Math.round(totalWaste).toLocaleString()}`, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Tools Connected", value: integrations.length, icon: Layers, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Audit Score", value: auditScore, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", isScore: true },
        ].map(({ label, value, icon: Icon, color, bg, isScore }) => (
          <div key={label} className="bg-card border border-border/60 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
              {isScore ? <ScoreRing score={value} /> : <p className="text-2xl font-bold">{value}</p>}
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Spend by category */}
        <motion.div {...fade(0.1)} className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">Spend by Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ left: -10 }}>
              <XAxis dataKey="cat" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `$${v}`} />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={`hsl(${217 + i * 20}, 80%, ${50 + i * 3}%)`} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Utilization heatmap */}
        <motion.div {...fade(0.12)} className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4">Utilization Heatmap</h2>
          <div className="grid grid-cols-3 gap-2">
            {integrations.map((i) => {
              const rate = i.licensed_seats > 0 ? Math.round((i.active_users / i.licensed_seats) * 100) : 0;
              return (
                <div key={i.id} className={`rounded-xl p-2.5 text-white ${utilColor(rate)}`}>
                  <p className="text-[11px] font-semibold truncate">{i.tool_name}</p>
                  <p className="text-lg font-extrabold">{rate}%</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;40%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 40-70%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> &gt;70%</span>
          </div>
        </motion.div>
      </div>

      {/* Top wasted spend */}
      {wastedTools.length > 0 && (
        <motion.div {...fade(0.15)} className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-destructive" />Top Wasted Spend</h2>
          <div className="space-y-2">
            {wastedTools.map((t, i) => {
              const rate = t.licensed_seats > 0 ? Math.round((t.active_users / t.licensed_seats) * 100) : 0;
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium">{t.tool_name}</p>
                      <span className="text-sm font-bold text-destructive font-mono">${Math.round(t.wasted)}/mo</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${utilColor(rate)}`} style={{ width: `${rate}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{rate}% utilized · {(t.licensed_seats || 0) - (t.active_users || 0)} inactive seats</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      {showWizard && <OnboardingWizard onComplete={handleWizardComplete} onDismiss={() => setShowWizard(false)} />}
    </div>
  );
}