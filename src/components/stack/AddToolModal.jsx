import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeToolName } from "@/lib/connectionStatus";

const CATEGORIES = ["Communication", "Project Management", "CRM & Sales", "Productivity & Docs", "Analytics & BI", "Marketing", "Customer Support", "Identity & Security", "Dev Tools", "Finance & HR"];
const POPULAR_TOOLS = ["Slack", "Zoom", "Notion", "Jira", "HubSpot", "Salesforce", "Google Workspace", "Figma", "Datadog", "Zendesk", "Okta", "Gusto", "Asana", "Monday.com", "Linear", "GitHub", "Intercom", "Mixpanel", "Mailchimp", "QuickBooks"];

const EMPTY = { tool_name: "", category: "Communication", monthly_cost: "", licensed_seats: "", active_users: "", connection_status: "Pending", notes: "" };

export default function AddToolModal({ tool, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!tool;

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (tool) {
      setForm({
        tool_name: tool.tool_name || "",
        category: tool.category || "Communication",
        monthly_cost: tool.monthly_cost ?? "",
        licensed_seats: tool.licensed_seats ?? "",
        active_users: tool.active_users ?? "",
        connection_status: tool.connection_status || "Pending",
        notes: tool.notes || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [tool]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const existing = await base44.entities.SaasIntegration.list("-updated_date", 500);
      if (existing.some((item) => normalizeToolName(item.tool_name) === normalizeToolName(data.tool_name))) {
        throw new Error(`${data.tool_name.trim()} is already in your inventory.`);
      }
      return base44.entities.SaasIntegration.create({ ...data, tool_name: data.tool_name.trim() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["integrations"] }); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SaasIntegration.update(tool.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["integrations"] }); onClose(); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      monthly_cost: Number(form.monthly_cost) || null,
      licensed_seats: Number(form.licensed_seats) || null,
      active_users: Number(form.active_users) || null,
      last_synced: new Date().toISOString().split("T")[0],
    };
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold">{isEdit ? "Edit Tool" : "Add Tool Manually"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && (
            <p className="text-sm text-muted-foreground -mt-1">
              Add any software your scan didn't pick up automatically.
            </p>
          )}
          <div>
            <Label className="text-xs mb-1 block">Tool Name *</Label>
            <Input list="tools-list" value={form.tool_name} onChange={(e) => setForm({ ...form, tool_name: e.target.value })} placeholder="e.g. Slack" required />
            <datalist id="tools-list">{POPULAR_TOOLS.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Category</Label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Monthly Cost ($)</Label>
              <Input type="number" min="0" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Licensed Seats</Label>
              <Input type="number" min="0" value={form.licensed_seats} onChange={(e) => setForm({ ...form, licensed_seats: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Active Users</Label>
              <Input type="number" min="0" value={form.active_users} onChange={(e) => setForm({ ...form, active_users: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Notes (optional)</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Vendor: Acme, renewal in Dec" />
          </div>
          {createMutation.error && <p className="text-sm text-destructive">{createMutation.error.message}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (isEdit ? "Saving..." : "Adding...") : (isEdit ? "Save Changes" : "Add Tool")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}