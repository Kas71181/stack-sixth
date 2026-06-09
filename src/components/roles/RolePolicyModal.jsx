import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const POPULAR_TOOLS = [
  "Slack", "GitHub", "Jira", "Notion", "Figma", "Salesforce", "HubSpot",
  "Zoom", "Google Workspace", "Okta", "Datadog", "Linear", "Asana",
  "Zendesk", "Intercom", "Gusto", "QuickBooks", "Mixpanel", "Stripe",
];

const SUGGESTED_ROLES = ["Engineer", "Sales Rep", "HR", "Marketing", "Finance", "Product Manager", "Customer Support", "Executive"];

function ToolTagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  const add = (tool) => {
    const t = tool.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };

  const remove = (tool) => onChange(value.filter((t) => t !== tool));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[36px] bg-muted/30 rounded-lg px-2 py-1.5 border border-input">
        {value.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
            {t}
            <button type="button" onClick={() => remove(t)} className="hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          list="tools-suggest"
        />
        <datalist id="tools-suggest">{POPULAR_TOOLS.map((t) => <option key={t} value={t} />)}</datalist>
      </div>
      <p className="text-[10px] text-muted-foreground">Type a tool name and press Enter to add</p>
    </div>
  );
}

const EMPTY = { role_name: "", required_tools: [], allowed_tools: [], blocked_tools: [] };

export default function RolePolicyModal({ policy, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!policy;
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (policy) {
      setForm({
        role_name: policy.role_name || "",
        required_tools: policy.required_tools || [],
        allowed_tools: policy.allowed_tools || [],
        blocked_tools: policy.blocked_tools || [],
      });
    } else {
      setForm(EMPTY);
    }
  }, [policy]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RolePolicy.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["role-policies"] }); onClose(); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.RolePolicy.update(policy.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["role-policies"] }); onClose(); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) updateMutation.mutate(form);
    else createMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-bold">{isEdit ? "Edit Role Policy" : "New Role Policy"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Label className="text-xs mb-1 block">Role Name *</Label>
            <Input
              list="roles-suggest"
              value={form.role_name}
              onChange={(e) => setForm({ ...form, role_name: e.target.value })}
              placeholder="e.g. Engineer, Sales Rep, HR"
              required
            />
            <datalist id="roles-suggest">{SUGGESTED_ROLES.map((r) => <option key={r} value={r} />)}</datalist>
          </div>

          <div>
            <Label className="text-xs mb-1 block text-emerald-700">✓ Required Tools</Label>
            <p className="text-[11px] text-muted-foreground mb-1.5">Tools this role MUST have — missing access = gap</p>
            <ToolTagInput
              value={form.required_tools}
              onChange={(v) => setForm({ ...form, required_tools: v })}
              placeholder="e.g. GitHub, Jira..."
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block text-primary">○ Allowed Tools</Label>
            <p className="text-[11px] text-muted-foreground mb-1.5">Tools this role is permitted to have (won't be flagged)</p>
            <ToolTagInput
              value={form.allowed_tools}
              onChange={(v) => setForm({ ...form, allowed_tools: v })}
              placeholder="e.g. Slack, Notion..."
            />
          </div>

          <div>
            <Label className="text-xs mb-1 block text-destructive">✕ Blocked Tools (Waste)</Label>
            <p className="text-[11px] text-muted-foreground mb-1.5">Tools this role should NOT have — flagged as waste</p>
            <ToolTagInput
              value={form.blocked_tools}
              onChange={(v) => setForm({ ...form, blocked_tools: v })}
              placeholder="e.g. Salesforce, Datadog..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Policy"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}