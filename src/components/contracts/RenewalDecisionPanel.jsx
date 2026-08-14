import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const decisions = ["Continue", "Renegotiate", "Cancel", "Replace"];
export default function RenewalDecisionPanel({ contract, onUpdated }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState("");
  const choose = async (decision) => {
    setSaving(decision);
    await base44.entities.Contract.update(contract.id, { decision_state: decision.toLowerCase(), last_reviewed: new Date().toISOString() });
    if (user?.role === "admin") await base44.entities.AuditTrailEvent.create({ entity_type: "Contract", entity_id: contract.id, entity_label: contract.vendor_name, action: "status_changed", actor_name: user.full_name || user.email, actor_email: user.email, old_value: contract.decision_state || "undecided", new_value: decision.toLowerCase(), note: `Renewal decision recorded: ${decision}.` });
    setSaving(""); onUpdated();
  };
  return <section className="rounded-xl border border-border bg-muted/30 p-4"><h3 className="text-sm font-bold">Decision needed</h3><p className="mt-1 text-xs text-muted-foreground">Review what should happen before this renewal.</p><div className="mt-3 grid grid-cols-2 gap-2">{decisions.map((decision) => <Button key={decision} size="sm" variant={contract.decision_state === decision.toLowerCase() ? "default" : "outline"} disabled={Boolean(saving)} onClick={() => choose(decision)}>{saving === decision ? "Saving…" : decision}</Button>)}</div></section>;
}