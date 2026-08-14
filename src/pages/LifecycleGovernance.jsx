import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ShieldCheck, TrendingDown, CalendarClock, AlertTriangle, DollarSign, Loader2 } from "lucide-react";
import LifecycleAlertCard from "@/components/lifecycle/LifecycleAlertCard";
import { toast } from "sonner";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function LifecycleGovernance({ embedded = false }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("evaluateLifecycle", {});
      setData(res.data);
    } catch {
      toast.error("Failed to load lifecycle alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAlerts();
  }, [user]);

  const handleAction = async (alert, action) => {
    setSavingId(alert.tool_name);
    try {
      if (action === "dismiss") {
        toast.success(`Alert dismissed for ${alert.tool_name}`);
      } else if (alert.type === "dormant" && alert.integration_id) {
        // Update integration status
        if (action === "cancel") {
          await base44.entities.SaasIntegration.update(alert.integration_id, {
            connection_status: "Manual Upload",
            notes: `Cancelled — ${alert.inactive_pct}% inactive users. ${new Date().toLocaleDateString()}`,
          });
          toast.success(`${alert.tool_name} marked for cancellation`);
        } else if (action === "downgrade") {
          await base44.entities.SaasIntegration.update(alert.integration_id, {
            notes: `Downgrade recommended — ${alert.inactive_pct}% inactive. Downgrading seats from ${alert.licensed_seats}.`,
          });
          toast.success(`${alert.tool_name} marked for downgrade`);
        }
      } else if (alert.type === "renewal" && alert.contract_id) {
        if (action === "cancel") {
          await base44.entities.Contract.update(alert.contract_id, {
            status: "Cancelled",
            negotiation_leverage: `Cancelled — low activity (${alert.avg_activity_score}/100). ${new Date().toLocaleDateString()}`,
          });
          toast.success(`${alert.tool_name} contract cancelled`);
        } else if (action === "renew") {
          await base44.entities.Contract.update(alert.contract_id, {
            negotiation_leverage: `Renewed — good usage. ${new Date().toLocaleDateString()}`,
          });
          toast.success(`${alert.tool_name} marked for renewal`);
        } else if (action === "negotiate") {
          await base44.entities.Contract.update(alert.contract_id, {
            negotiation_leverage: `Negotiating — activity score ${alert.avg_activity_score}/100. Target 10-15% discount. ${new Date().toLocaleDateString()}`,
          });
          toast.success(`${alert.tool_name} marked for negotiation`);
        }
      }
      await base44.entities.AuditTrailEvent.create({
        entity_type: alert.type === "renewal" ? "Contract" : "SaasIntegration",
        entity_id: alert.contract_id || alert.integration_id || alert.tool_name,
        entity_label: alert.tool_name,
        action: action === "cancel" ? "status_changed" : "updated",
        actor_name: user.full_name || user.email,
        actor_email: user.email,
        old_value: "Review required",
        new_value: action,
        note: `Governance action: ${action}`,
      });
      // Reload alerts after action
      await loadAlerts();
    } catch {
      toast.error("Failed to process action");
    } finally {
      setSavingId(null);
    }
  };

  const alerts = data?.alerts || [];
  const filtered = filter === "all" ? alerts : filter === "dormant" ? alerts.filter((a) => a.type === "dormant") : alerts.filter((a) => a.type === "renewal");
  const summary = data?.summary;

  return (
    <div className={`${embedded ? "" : "max-w-5xl mx-auto"} space-y-6`}>
      {/* Header */}
      {!embedded && <motion.div {...fade()}>
        <h1 className="text-page flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Lifecycle Governance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Automated guardrails — dormant tools get flagged for downgrade, renewals hit a decision gate before auto-renewing.</p>
      </motion.div>}

      {/* Summary stats */}
      {summary && (
        <motion.div {...fade(0.05)} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card">
            <AlertTriangle className="w-4 h-4 text-amber-500 mb-1" />
            <p className="text-2xl font-black">{summary.total_alerts}</p>
            <p className="text-xs text-muted-foreground">Active Alerts</p>
          </div>
          <div className="stat-card">
            <TrendingDown className="w-4 h-4 text-red-500 mb-1" />
            <p className="text-2xl font-black">{summary.dormant_count}</p>
            <p className="text-xs text-muted-foreground">Dormant Tools</p>
          </div>
          <div className="stat-card">
            <CalendarClock className="w-4 h-4 text-primary mb-1" />
            <p className="text-2xl font-black">{summary.renewal_count}</p>
            <p className="text-xs text-muted-foreground">Upcoming Renewals</p>
          </div>
          <div className="stat-card">
            <DollarSign className="w-4 h-4 text-emerald-500 mb-1" />
            <p className="text-2xl font-black">${summary.total_wasted.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Wasted / Month</p>
          </div>
        </motion.div>
      )}

      {/* Filter tabs */}
      <motion.div {...fade(0.1)} className="tab-track inline-flex p-1 gap-1">
        {[
          { key: "all", label: "All", count: alerts.length },
          { key: "dormant", label: "Dormant", count: summary?.dormant_count || 0 },
          { key: "renewal", label: "Renewals", count: summary?.renewal_count || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === tab.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
            {tab.count > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">{tab.count}</span>}
          </button>
        ))}
      </motion.div>

      {/* Alerts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div {...fade(0.1)} className="glass-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="font-semibold text-sm">All clear — no lifecycle alerts</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">Your tools are healthy and no renewals need immediate attention.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert, i) => (
            <motion.div key={`${alert.type}-${alert.tool_name}-${i}`} {...fade(0.1 + i * 0.03)}>
              <LifecycleAlertCard alert={alert} onAction={handleAction} isSaving={savingId === alert.tool_name} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}