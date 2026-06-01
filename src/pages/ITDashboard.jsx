import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Monitor, Layers, AlertCircle, LayoutDashboard, Users, FileText, Plug, Zap } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import SoftwareEvaluationTable from "../components/itdashboard/SoftwareEvaluationTable";
import DecisionPanel from "../components/itdashboard/DecisionPanel";
import ITSummaryStats from "../components/itdashboard/ITSummaryStats";
import ExportToSheetsButton from "../components/itdashboard/ExportToSheetsButton";
import SpendTrendChart from "../components/itdashboard/SpendTrendChart";
import ToolComparisonPanel from "../components/itdashboard/ToolComparisonPanel";
import StackDashboard from "./StackDashboard";
import ToolStack from "./ToolStack";
import UsageAnalytics from "./UsageAnalytics";
import AuditReportPage from "./AuditReportPage";
import IntegrationsPage from "./IntegrationsPage";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const TABS = [
  { id: "decisions", label: "AI Decisions", icon: Monitor },
  { id: "overview", label: "SaaS Overview", icon: LayoutDashboard },
  { id: "tools", label: "Tool Stack", icon: Layers },
  { id: "usage", label: "Usage Analytics", icon: Users },
  { id: "audit", label: "Audit Report", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Plug },
];

export default function ITDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("decisions");
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["audits-it", user?.id],
    queryFn: () => base44.entities.SoftwareAudit.filter({ created_by_id: user?.id }, "-created_date", 50),
    enabled: !!user?.id,
  });

  const completedAudits = audits.filter((a) => a.status === "completed");

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SoftwareAudit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audits-it"] }),
    onError: () => {},
  });

  const allTools = completedAudits.flatMap((audit) =>
    (audit.analysis_result?.recommendations || []).map((rec, idx) => ({
      ...rec,
      _auditId: audit.id,
      _auditName: audit.company_name,
      _recIdx: idx,
      _decision: audit.analysis_result?.decisions?.[idx] || null,
    }))
  );

  const handleDecision = (tool, decision) => {
    const audit = completedAudits.find((a) => a.id === tool._auditId);
    if (!audit) return;
    const decisions = { ...(audit.analysis_result?.decisions || {}) };
    decisions[tool._recIdx] = decision;
    updateMutation.mutate({
      id: audit.id,
      data: { analysis_result: { ...audit.analysis_result, decisions } },
    });
    setSelectedRec(null);
  };

  const decided = allTools.filter((t) => t._decision);
  const pending = allTools.filter((t) => !t._decision);
  const approved = allTools.filter((t) => t._decision === "approve");
  const rejected = allTools.filter((t) => t._decision === "reject");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fade()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">IT Manager</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your SaaS stack, usage, and AI recommendations</p>
          </div>
        </div>
        {activeTab === "decisions" && (
          <div className="flex flex-wrap items-center gap-2">
            <ExportToSheetsButton
              tools={selectedAudit ? allTools.filter((t) => t._auditId === selectedAudit) : allTools}
              auditName={selectedAudit ? completedAudits.find((a) => a.id === selectedAudit)?.company_name : "All Audits"}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 border border-border/60 rounded-xl px-3 py-2">
              <Layers className="w-3.5 h-3.5" />
              <span><strong className="text-foreground">{completedAudits.length}</strong> audit{completedAudits.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tab bar */}
      <motion.div {...fade(0.04)} className="flex gap-1 bg-muted/50 border border-border/60 rounded-2xl p-1.5 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === id
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      {activeTab === "decisions" && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : completedAudits.length === 0 ? (
            <div className="text-center py-32">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-5">
                <Monitor className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="font-bold text-lg text-foreground">No audits yet</p>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">Complete a software audit first to unlock AI decision tools.</p>
              <RouterLink
                to="/audit"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                Start Your First Audit
              </RouterLink>
            </div>
          ) : (
            <div className="space-y-7">
              {updateMutation.isError && (
                <motion.div {...fade()} className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Failed to save decision. Please try again.
                </motion.div>
              )}
              <motion.div {...fade(0.05)}>
                <SpendTrendChart audits={completedAudits} />
              </motion.div>
              <motion.div {...fade(0.08)}>
                <ITSummaryStats
                  total={allTools.length}
                  pending={pending.length}
                  approved={approved.length}
                  rejected={rejected.length}
                  tools={allTools}
                />
              </motion.div>
              {allTools.length >= 2 && (
                <motion.div {...fade(0.12)}>
                  <ToolComparisonPanel tools={selectedAudit ? allTools.filter((t) => t._auditId === selectedAudit) : allTools} />
                </motion.div>
              )}
              <motion.div {...fade(0.1)} className="bg-card border border-border/60 rounded-2xl px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Filter by Audit</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedAudit(null)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      !selectedAudit
                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    All Audits ({completedAudits.length})
                  </button>
                  {completedAudits.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAudit(a.id === selectedAudit ? null : a.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedAudit === a.id
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {a.company_name}
                    </button>
                  ))}
                </div>
              </motion.div>
              <motion.div {...fade(0.15)} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3 min-w-0">
                  <SoftwareEvaluationTable
                    tools={selectedAudit ? allTools.filter((t) => t._auditId === selectedAudit) : allTools}
                    selectedRec={selectedRec}
                    onSelect={setSelectedRec}
                  />
                </div>
                <div className="lg:col-span-2">
                  <DecisionPanel
                    tool={selectedRec}
                    onDecision={handleDecision}
                    isSaving={updateMutation.isPending}
                    onClose={() => setSelectedRec(null)}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}

      {activeTab === "overview" && <StackDashboard embedded />}
      {activeTab === "tools" && <ToolStack />}
      {activeTab === "usage" && <UsageAnalytics />}
      {activeTab === "audit" && <AuditReportPage />}
      {activeTab === "integrations" && <IntegrationsPage />}
    </div>
  );
}