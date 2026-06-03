import { useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const PHASES = ["Planning", "Parallel Run", "Cutover", "Completed"];

const PHASE_DESCRIPTIONS = {
  Planning: "Align stakeholders, document requirements, and get buy-in before touching anything.",
  "Parallel Run": "Run both tools simultaneously. Migrate data. Train users. Expect friction.",
  Cutover: "Set a hard off-date. Cancel the old tool before its renewal. Communicate clearly.",
  Completed: "Verify adoption at 30 days. Confirm the old tool is fully cancelled.",
};

export default function SwitchPlanDetail({ plan, onBack, onUpdated, onDeleted }) {
  const [localPlan, setLocalPlan] = useState(plan);
  const [saving, setSaving] = useState(false);

  const savings = (localPlan.monthly_cost_old || 0) - (localPlan.monthly_cost_new || 0);

  const toggleCheck = async (id) => {
    const updated = {
      ...localPlan,
      checklist: localPlan.checklist.map((c) =>
        c.id === id ? { ...c, completed: !c.completed } : c
      ),
    };
    setLocalPlan(updated);
    await base44.entities.SwitchPlan.update(localPlan.id, { checklist: updated.checklist });
    onUpdated(updated);
  };

  const updateStatus = async (status) => {
    const updated = { ...localPlan, status };
    setLocalPlan(updated);
    await base44.entities.SwitchPlan.update(localPlan.id, { status });
    onUpdated(updated);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this switch plan (${localPlan.from_tool} → ${localPlan.to_tool})?`)) return;
    await base44.entities.SwitchPlan.delete(localPlan.id);
    onDeleted(localPlan.id);
  };

  const checklistByPhase = PHASES.reduce((acc, phase) => {
    acc[phase] = (localPlan.checklist || []).filter((c) => c.phase === phase);
    return acc;
  }, {});

  const currentPhaseIndex = PHASES.indexOf(localPlan.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {localPlan.from_tool} <ArrowRight className="w-4 h-4 text-muted-foreground" /> {localPlan.to_tool}
          </h2>
          {localPlan.reason && <p className="text-sm text-muted-foreground">{localPlan.reason}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Select value={localPlan.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Planning", "Parallel Run", "Cutover", "Completed", "Cancelled"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Monthly Savings", value: savings !== 0 ? `${savings > 0 ? "+" : ""}$${savings}/mo` : "—", highlight: savings > 0 },
          { label: "Affected Users", value: localPlan.affected_users || "—" },
          { label: "Cutover Date", value: localPlan.cutover_date || "Not set" },
          { label: "Old Renewal", value: localPlan.old_tool_renewal_date || "Not set" },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-card border border-border/60 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`font-semibold text-sm ${highlight ? "text-emerald-600" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Phases */}
      <div className="space-y-5">
        {PHASES.map((phase, idx) => {
          const items = checklistByPhase[phase] || [];
          const phaseComplete = items.length > 0 && items.every((c) => c.completed);
          const isCurrent = idx === currentPhaseIndex;
          const isPast = idx < currentPhaseIndex;

          return (
            <div key={phase} className={`border rounded-xl p-4 ${isCurrent ? "border-primary/40 bg-accent/30" : isPast ? "border-border/40 opacity-70" : "border-border/40"}`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${phaseComplete ? "bg-emerald-500 text-white" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {idx + 1}
                  </span>
                  {phase}
                  {isCurrent && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Current</span>}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{PHASE_DESCRIPTIONS[phase]}</p>
              <div className="space-y-2">
                {items.map((item) => (
                  <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCheck(item.id)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className={`text-sm leading-snug ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Champion */}
      {localPlan.champion && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          Champion: <span className="font-medium text-foreground">{localPlan.champion}</span>
        </div>
      )}
    </div>
  );
}