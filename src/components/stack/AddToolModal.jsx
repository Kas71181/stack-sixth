import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Communication", "Project Management", "CRM & Sales", "Productivity & Docs", "Analytics & BI", "Marketing", "Customer Support", "Identity & Security", "Dev Tools", "Finance & HR"];

const POPULAR_TOOLS = ["Slack", "Zoom", "Notion", "Jira", "HubSpot", "Salesforce", "Google Workspace", "Figma", "Datadog", "Zendesk", "Okta", "Gusto", "Asana", "Monday.com", "Linear", "GitHub", "Intercom", "Mixpanel", "Mailchimp", "QuickBooks"];

export default function AddToolModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ tool_name: "", category: "Communication", monthly_cost: "", licensed_seats: "", active_users: "", connection_status: "Manual Upload" });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SaasIntegration.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["integrations"] }); onClose(); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      monthly_cost: Number(form.monthly_cost) || null,
      licensed_seats: Number(form.licensed_seats) || null,
      active_users: Number(form.active_users) || null,
      last_synced: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold">Add Tool</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Tool Name</Label>
            <Input list="tools" value={form.tool_name} onChange={(e) => setForm({ ...form, tool_name: e.target.value })} placeholder="e.g. Slack" required />
            <datalist id="tools">{POPULAR_TOOLS.map((t) => <option key={t} value={t} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Category</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Connection</Label>
              <select value={form.connection_status} onChange={(e) => setForm({ ...form, connection_status: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                {["Connected", "Manual Upload", "Pending"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Monthly Cost ($)</Label>
              <Input type="number" value={form.monthly_cost} onChange={(e) => setForm({ ...form, monthly_cost: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Licensed Seats</Label>
              <Input type="number" value={form.licensed_seats} onChange={(e) => setForm({ ...form, licensed_seats: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Active Users</Label>
              <Input type="number" value={form.active_users} onChange={(e) => setForm({ ...form, active_users: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">{createMutation.isPending ? "Adding..." : "Add Tool"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}