import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Activity, Bell, BellOff, RefreshCw, Plus, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import MonitorCard from "../components/monitoring/MonitorCard";
import MonitorSetupModal from "../components/monitoring/MonitorSetupModal";
import MonitorReportDetail from "../components/monitoring/MonitorReportDetail";
import SpendTrendChart from "../components/monitoring/SpendTrendChart";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function Monitoring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [savingFreq, setSavingFreq] = useState(false);

  const handleFrequencyChange = async (val) => {
    setSavingFreq(true);
    await base44.auth.updateMe({ reminder_frequency: val });
    setSavingFreq(false);
  };

  const { data: audits = [] } = useQuery({
    queryKey: ["audits-monitor", user?.email],
    queryFn: () => base44.entities.SoftwareAudit.filter({ created_by: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["monitor-reports", user?.email],
    queryFn: () => base44.entities.ToolMonitor.filter({ created_by: user?.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  const completedAudits = audits.filter((a) => a.status === "completed");

  // Group reports by audit_id — latest per audit = active monitor
  const monitorsByAudit = completedAudits.map((audit) => {
    const auditReports = reports
      .filter((r) => r.audit_id === audit.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return { audit, reports: auditReports, latest: auditReports[0] || null };
  }).filter((m) => m.reports.length > 0 || completedAudits.length > 0);

  const handleGenerateReport = async (auditId) => {
    setGeneratingId(auditId);
    try {
      await base44.functions.invoke("generateMonitoringReport", { audit_id: auditId });
      queryClient.invalidateQueries({ queryKey: ["monitor-reports"] });
    } finally {
      setGeneratingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div {...fade()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Continuous Monitoring</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Periodic AI-powered reports on your software stack health</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border/60 rounded-xl px-3 py-2">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">Reminders:</span>
            <select
              defaultValue={user?.reminder_frequency || "daily"}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              disabled={savingFreq}
              className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer text-foreground"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Monitor
          </button>
        </div>
      </motion.div>

      {completedAudits.length === 0 ? (
        <motion.div {...fade(0.05)} className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-5">
            <Activity className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-bold text-lg">No completed audits</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">Complete a software audit first to start monitoring your stack.</p>
          <RouterLink to="/audit" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            Start an Audit
          </RouterLink>
        </motion.div>
      ) : (
        <>
          {/* Spend Trend Chart */}
          {reports.length > 1 && (
            <motion.div {...fade(0.05)}>
              <SpendTrendChart reports={reports} audits={completedAudits} />
            </motion.div>
          )}

          {/* Monitor cards per audit */}
          <motion.div {...fade(0.08)} className="space-y-4">
            {completedAudits.map((audit) => {
              const auditReports = reports
                .filter((r) => r.audit_id === audit.id)
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
              return (
                <MonitorCard
                  key={audit.id}
                  audit={audit}
                  reports={auditReports}
                  isGenerating={generatingId === audit.id}
                  onGenerate={() => handleGenerateReport(audit.id)}
                  onSelectReport={setSelectedReport}
                  selectedReport={selectedReport}
                />
              );
            })}
          </motion.div>

          {/* Inline report detail */}
          {selectedReport && (
            <motion.div {...fade(0.05)}>
              <MonitorReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} />
            </motion.div>
          )}
        </>
      )}

      {showSetup && (
        <MonitorSetupModal
          audits={completedAudits}
          reports={reports}
          onClose={() => setShowSetup(false)}
          onGenerate={handleGenerateReport}
          generatingId={generatingId}
        />
      )}
    </div>
  );
}