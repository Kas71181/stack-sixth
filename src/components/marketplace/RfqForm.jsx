import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Megaphone } from "lucide-react";

const CATEGORIES = [
  "Communication", "Project Management", "CRM & Sales", "Productivity & Docs",
  "Analytics & BI", "Marketing", "Customer Support", "Identity & Security",
  "Dev Tools", "Finance & HR",
];

export default function RfqForm({ user, onSubmit, submitting }) {
  const [form, setForm] = useState({
    tool_name: "",
    category: "",
    required_seats: "5",
    max_budget: "",
    use_case: "",
    must_haves: "",
    contract_term: "12",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      requester_name: user?.full_name || "",
      requester_email: user?.email || "",
      required_seats: parseInt(form.required_seats) || 1,
      max_budget: parseFloat(form.max_budget) || 0,
      contract_term_months: parseInt(form.contract_term) || 12,
      must_haves: form.must_haves.split("\n").filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-section font-bold">Post a Software Need</h2>
          <p className="text-xs text-muted-foreground">Vendors will submit competitive bids — you compare and pick the best offer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Tool / Category Needed *</Label>
          <Input
            required
            value={form.tool_name}
            onChange={(e) => set("tool_name", e.target.value)}
            placeholder="e.g. CRM for sales team"
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
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Seats Needed</Label>
          <Input type="number" min="1" value={form.required_seats} onChange={(e) => set("required_seats", e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Max Budget / Mo ($)</Label>
          <Input type="number" min="0" value={form.max_budget} onChange={(e) => set("max_budget", e.target.value)} placeholder="500" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Contract Term (mo)</Label>
          <Input type="number" min="1" value={form.contract_term} onChange={(e) => set("contract_term", e.target.value)} className="h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Use Case</Label>
        <Input value={form.use_case} onChange={(e) => set("use_case", e.target.value)} placeholder="What problem are you solving?" className="h-9" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Must-Have Features (one per line)</Label>
        <Textarea
          value={form.must_haves}
          onChange={(e) => set("must_haves", e.target.value)}
          placeholder={"SSO integration\nAPI access\nMobile app"}
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <Button type="submit" disabled={submitting || !form.tool_name || !form.category} className="w-full btn-glow">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : <><Send className="w-4 h-4" /> Post to Marketplace</>}
      </Button>
    </form>
  );
}