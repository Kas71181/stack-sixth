import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const DEFAULT_CHECKLIST = [
  { id: "1", label: "Identify decision maker & internal champion", phase: "Planning", completed: false },
  { id: "2", label: "Get buy-in from affected team leads", phase: "Planning", completed: false },
  { id: "3", label: "Document data migration requirements", phase: "Planning", completed: false },
  { id: "4", label: "Set up new tool and migrate critical data", phase: "Parallel Run", completed: false },
  { id: "5", label: "Run both tools simultaneously (2–4 weeks)", phase: "Parallel Run", completed: false },
  { id: "6", label: "Train affected users on new tool", phase: "Parallel Run", completed: false },
  { id: "7", label: "Set hard cutover date and communicate to team", phase: "Cutover", completed: false },
  { id: "8", label: "Cancel / downgrade old tool before renewal", phase: "Cutover", completed: false },
  { id: "9", label: "Confirm old tool is no longer in use", phase: "Cutover", completed: false },
  { id: "10", label: "Verify adoption — check usage data at 30 days", phase: "Completed", completed: false },
];

export default function NewSwitchPlanModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    from_tool: "",
    to_tool: "",
    reason: "",
    cutover_date: "",
    old_tool_renewal_date: "",
    monthly_cost_old: "",
    monthly_cost_new: "",
    affected_users: "",
    champion: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.from_tool || !form.to_tool) return;
    setSaving(true);
    const plan = await base44.entities.SwitchPlan.create({
      ...form,
      monthly_cost_old: form.monthly_cost_old ? Number(form.monthly_cost_old) : undefined,
      monthly_cost_new: form.monthly_cost_new ? Number(form.monthly_cost_new) : undefined,
      affected_users: form.affected_users ? Number(form.affected_users) : undefined,
      status: "Planning",
      decision_date: new Date().toISOString().split("T")[0],
      checklist: DEFAULT_CHECKLIST,
    });
    setSaving(false);
    onCreated(plan);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Switch Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Switching From *</Label>
              <Input placeholder="e.g. Notion" value={form.from_tool} onChange={(e) => set("from_tool", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Switching To *</Label>
              <Input placeholder="e.g. Confluence" value={form.to_tool} onChange={(e) => set("to_tool", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={form.reason} onValueChange={(v) => set("reason", v)}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {["Cost Savings", "Feature Gap", "Consolidation", "Better Alternative", "Vendor Issue", "Other"].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monthly Cost (Old)</Label>
              <Input type="number" placeholder="$" value={form.monthly_cost_old} onChange={(e) => set("monthly_cost_old", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Cost (New)</Label>
              <Input type="number" placeholder="$" value={form.monthly_cost_new} onChange={(e) => set("monthly_cost_new", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Old Tool Renewal Date</Label>
              <Input type="date" value={form.old_tool_renewal_date} onChange={(e) => set("old_tool_renewal_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Cutover Date</Label>
              <Input type="date" value={form.cutover_date} onChange={(e) => set("cutover_date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Affected Users</Label>
              <Input type="number" placeholder="0" value={form.affected_users} onChange={(e) => set("affected_users", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Champion</Label>
              <Input placeholder="Name or email" value={form.champion} onChange={(e) => set("champion", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !form.from_tool || !form.to_tool}>
            {saving ? "Creating..." : "Create Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}