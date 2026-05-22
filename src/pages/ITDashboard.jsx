import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Monitor, CheckCircle2, XCircle, Clock, DollarSign, Package, Users, TrendingDown } from "lucide-react";
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
      <div className="text-center py-32 text-muted-foreground">
        <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No completed audits yet</p>
        <p className="text-sm mt-1">Run an audit first to unlock the IT dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fade()}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">IT Manager Dashboard</h1>
            <p className="text-sm text-muted-foreground">Evaluate software recommendations and execute decisions</p>
          </div>
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
      <motion.div {...fade(0.1)}>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mr-1">Filter by audit:</span>
          <button
            onClick={() => setSelectedAudit(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              !selectedAudit ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            All ({completedAudits.length})
          </button>
          {completedAudits.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedAudit(a.id === selectedAudit ? null : a.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedAudit === a.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {a.company_name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Table + Panel */}
      <motion.div {...fade(0.15)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SoftwareEvaluationTable
            tools={selectedAudit ? allTools.filter((t) => t._auditId === selectedAudit) : allTools}
            selectedRec={selectedRec}
            onSelect={setSelectedRec}
          />
        </div>
        <div>
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