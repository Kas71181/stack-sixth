import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Sparkles } from "lucide-react";

const CATEGORIES = [
  "Communication",
  "Project Management",
  "CRM & Sales",
  "Productivity & Docs",
  "Analytics & BI",
  "Marketing",
  "Customer Support",
  "Identity & Security",
  "Dev Tools",
  "Finance & HR",
];

export default function RequestForm({ user, onSubmit, evaluating }) {
  const [form, setForm] = useState({
    tool_name: "",
    vendor_url: "",
    category: "",
    estimated_monthly_cost: "",
    requested_seats: "1",
    team_affected: "",
    justification: "",
    use_case: "",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      requester_name: user?.full_name || "",
      requester_email: user?.email || "",
      estimated_monthly_cost: parseFloat(form.estimated_monthly_cost) || 0,
      requested_seats: parseInt(form.requested_seats) || 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-section font-bold">Request New Software</h2>
          <p className="text-xs text-muted-foreground">Stack Sixth will evaluate your request against your stack, budget, and policies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Tool Name *</Label>
          <Input
            required
            value={form.tool_name}
            onChange={(e) => set("tool_name", e.target.value)}
            placeholder="e.g. HubSpot"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Category *</Label>
          <select
            required
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50"
          >
            <option value="">Select category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Cost / Seat / Mo ($)</Label>
          <Input
            type="number"
            min="0"
            value={form.estimated_monthly_cost}
            onChange={(e) => set("estimated_monthly_cost", e.target.value)}
            placeholder="50"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Seats</Label>
          <Input
            type="number"
            min="1"
            value={form.requested_seats}
            onChange={(e) => set("requested_seats", e.target.value)}
            placeholder="5"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Team / Dept</Label>
          <Input
            value={form.team_affected}
            onChange={(e) => set("team_affected", e.target.value)}
            placeholder="Engineering"
            className="h-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Vendor URL</Label>
        <Input
          type="url"
          value={form.vendor_url}
          onChange={(e) => set("vendor_url", e.target.value)}
          placeholder="https://hubspot.com"
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Primary Use Case</Label>
        <Input
          value={form.use_case}
          onChange={(e) => set("use_case", e.target.value)}
          placeholder="e.g. Lead tracking and email automation"
          className="h-9"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Business Justification</Label>
        <Textarea
          value={form.justification}
          onChange={(e) => set("justification", e.target.value)}
          placeholder="Why does the team need this tool? What problem does it solve?"
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={evaluating || !form.tool_name || !form.category}
        className="w-full btn-glow"
      >
        {evaluating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating request…</>
        ) : (
          <><Send className="w-4 h-4" /> Submit for AI Evaluation</>
        )}
      </Button>
    </form>
  );
}