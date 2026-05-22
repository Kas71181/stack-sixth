import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Monitor, Layers, Link } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import SoftwareEvaluationTable from "../components/itdashboard/SoftwareEvaluationTable";
import DecisionPanel from "../components/itdashboard/DecisionPanel";
import ITSummaryStats from "../components/itdashboard/ITSummaryStats";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function ITDashboard() {
  const queryClient = useQueryClient();
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ["audits-it"],
    queryFn: () => base44.entities.SoftwareAudit.list("-created_date", 50),
  });

  const completedAudits = audits.filter((a) => a.status === "completed");

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SoftwareAudit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audits-it"] }),
  });

  // Flatten all recommendations across audits with audit context
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (completedAudits.length === 0) {
    return (
      <div className="text-center py-32">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-5">
          <Monitor className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <p className="font-bold text-lg text-foreground">No audits yet</p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">Complete a software audit first to unlock the IT Manager Dashboard.</p>
        <RouterLink
          to="/audit"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          Start Your First Audit
        </RouterLink>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div {...fade()} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">IT Manager Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Evaluate AI recommendations and execute software decisions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 border border-border/60 rounded-xl px-3 py-2">
          <Layers className="w-3.5 h-3.5" />
          <span><strong className="text-foreground">{completedAudits.length}</strong> audit{completedAudits.length !== 1 ? "s" : ""} analyzed</span>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div {...fade(0.05)}>
        <ITSummaryStats
          total={allTools.length}
          pending={pending.length}
          approved={approved.length}
          rejected={rejected.length}
          tools={allTools}
        />
      </motion.div>

      {/* Audit filter */}
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

      {/* Main Table + Panel */}
      <motion.div {...fade(0.15)} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
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
  );
}