import { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COPY = {
  continue: ["Confirm continued renewal", "Enter the next renewal date so this subscription is no longer overdue."],
  renegotiate: ["Start renegotiation", "Assign an owner and follow-up date for the vendor conversation."],
  cancel: ["Record cancellation decision", "Record the decision without claiming the vendor subscription is already cancelled."],
  replace: ["Plan a replacement", "Name the replacement and set a target cutover date."],
};
export default function RenewalResolutionForm({ action, contract, onBack, onResolved }) {
  const [form, setForm] = useState({ renewal_date: "", monthly_cost: contract.monthly_cost || "", annual_cost: contract.annual_cost || "", owner: contract.governance_owner_name || "", owner_email: contract.governance_owner_email || "", follow_up: contract.reminder_date || "", replacement_tool: "", cutover_date: "" });
  const [saving, setSaving] = useState(false), [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const details = action === "continue" ? { proposed_renewal_date: form.renewal_date, proposed_monthly_cost: form.monthly_cost || null, proposed_annual_cost: form.annual_cost || null } : action === "renegotiate" ? { owner: form.owner, owner_email: form.owner_email, follow_up: form.follow_up } : action === "replace" ? { replacement_tool: form.replacement_tool, cutover_date: form.cutover_date } : {};
      await base44.functions.invoke("recordGovernanceAction", { entity_type: "Contract", entity_id: contract.id, action, details });
      onResolved();
    } catch (err) { setError(err?.message || "This renewal could not be resolved."); setSaving(false); }
  };
  const [title, description] = COPY[action];
  return <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border bg-card p-4"><div><h4 className="text-sm font-bold">{title}</h4><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
    {action === "continue" && <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Next renewal date<Input className="mt-1" type="date" required value={form.renewal_date} onChange={(e) => update("renewal_date", e.target.value)} /></label><label className="text-xs font-semibold">Monthly cost<Input className="mt-1" type="number" min="0" value={form.monthly_cost} onChange={(e) => update("monthly_cost", e.target.value)} /></label><label className="text-xs font-semibold">Annual cost<Input className="mt-1" type="number" min="0" value={form.annual_cost} onChange={(e) => update("annual_cost", e.target.value)} /></label></div>}
    {action === "renegotiate" && <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Decision owner<Input className="mt-1" required value={form.owner} onChange={(e) => update("owner", e.target.value)} /></label><label className="text-xs font-semibold">Owner email<Input className="mt-1" type="email" value={form.owner_email} onChange={(e) => update("owner_email", e.target.value)} /></label><label className="text-xs font-semibold sm:col-span-2">Follow-up date<Input className="mt-1" type="date" required value={form.follow_up} onChange={(e) => update("follow_up", e.target.value)} /></label></div>}
    {action === "replace" && <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Replacement tool<Input className="mt-1" required value={form.replacement_tool} onChange={(e) => update("replacement_tool", e.target.value)} /></label><label className="text-xs font-semibold">Target cutover<Input className="mt-1" type="date" required value={form.cutover_date} onChange={(e) => update("cutover_date", e.target.value)} /></label></div>}
    {action === "cancel" && <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs text-foreground/80">This keeps the contract in history but removes it from active renewal attention.</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={onBack}>Back</Button><Button type="submit" size="sm" variant={action === "cancel" ? "destructive" : "default"} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{action === "cancel" ? "Record cancellation decision" : "Record decision"}</Button></div>
  </form>;
}