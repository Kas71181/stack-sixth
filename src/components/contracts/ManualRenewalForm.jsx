import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

const nextDate = (date, frequency) => {
  if (!date || frequency === "unknown") return "";
  const value = new Date(`${date}T12:00:00`);
  const advance = () => {
    if (frequency === "monthly") value.setMonth(value.getMonth() + 1);
    if (frequency === "quarterly") value.setMonth(value.getMonth() + 3);
    if (frequency === "annual") value.setFullYear(value.getFullYear() + 1);
  };
  do advance(); while (value < new Date());
  return value.toISOString().split("T")[0];
};

export default function ManualRenewalForm({ onCreated, onCancel }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ vendor_name: "", last_renewal_date: "", renewal_date: "", billing_frequency: "annual", monthly_cost: "", notice_period_days: "30", governance_owner_name: user?.full_name || "", governance_owner_email: user?.email || "" });
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    const days = Math.ceil((new Date(form.renewal_date) - new Date()) / 86400000);
    const contract = await base44.entities.Contract.create({ ...form, monthly_cost: Number(form.monthly_cost) || 0, notice_period_days: Number(form.notice_period_days) || 0, contract_type: "Other", renewal_source: "manual", renewal_confidence: 100, needs_confirmation: false, decision_state: "undecided", status: days < 0 ? "Expired" : days <= 60 ? "Expiring Soon" : "Active" });
    if (user?.role === "admin") await base44.entities.AuditTrailEvent.create({ entity_type: "Contract", entity_id: contract.id, entity_label: contract.vendor_name, action: "created", actor_name: user.full_name || user.email, actor_email: user.email, new_value: contract.renewal_date, note: "Renewal added manually." });
    onCreated();
  };
  const changeLast = (value) => setForm((current) => ({ ...current, last_renewal_date: value, renewal_date: nextDate(value, current.billing_frequency) }));
  const changeFrequency = (value) => setForm((current) => ({ ...current, billing_frequency: value, renewal_date: nextDate(current.last_renewal_date, value) }));
  return <form onSubmit={submit} className="glass-card grid gap-3 p-5 sm:grid-cols-2">
    <div className="sm:col-span-2"><h3 className="font-bold">Add a renewal</h3><p className="text-xs text-muted-foreground">No contract required. Enter what you know and adjust the calculated date.</p></div>
    <Input required placeholder="Tool or vendor" value={form.vendor_name} onChange={(e) => set("vendor_name", e.target.value)} />
    <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm" value={form.billing_frequency} onChange={(e) => changeFrequency(e.target.value)}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="unknown">Unknown</option></select>
    <label className="space-y-1 text-xs text-muted-foreground">Last renewal or payment<Input type="date" value={form.last_renewal_date} onChange={(e) => changeLast(e.target.value)} /></label>
    <label className="space-y-1 text-xs text-muted-foreground">Next renewal<Input required type="date" value={form.renewal_date} onChange={(e) => set("renewal_date", e.target.value)} /></label>
    <Input type="number" min="0" placeholder="Monthly cost" value={form.monthly_cost} onChange={(e) => set("monthly_cost", e.target.value)} />
    <Input type="number" min="0" placeholder="Cancellation notice (days)" value={form.notice_period_days} onChange={(e) => set("notice_period_days", e.target.value)} />
    <Input placeholder="Decision owner" value={form.governance_owner_name} onChange={(e) => set("governance_owner_name", e.target.value)} />
    <Input type="email" placeholder="Owner email" value={form.governance_owner_email} onChange={(e) => set("governance_owner_email", e.target.value)} />
    <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button disabled={saving}>{saving ? "Saving…" : "Track renewal"}</Button></div>
  </form>;
}