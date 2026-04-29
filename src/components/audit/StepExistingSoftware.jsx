import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Package } from "lucide-react";

const CATEGORY_OPTIONS = [
  "CRM",
  "Communication",
  "Project Management",
  "Accounting",
  "Marketing",
  "Customer Support",
  "HR",
  "Analytics",
  "Design",
  "Development",
  "Storage",
  "Other",
];

export default function StepExistingSoftware({ data, onChange }) {
  const software = data.existing_software || [];
  const [draft, setDraft] = useState({ name: "", category: "", monthly_cost: "" });

  const addSoftware = () => {
    if (!draft.name.trim()) return;
    const entry = {
      name: draft.name.trim(),
      category: draft.category || "Other",
      monthly_cost: draft.monthly_cost ? parseFloat(draft.monthly_cost) : null,
    };
    onChange({ existing_software: [...software, entry] });
    setDraft({ name: "", category: "", monthly_cost: "" });
  };

  const removeSoftware = (index) => {
    onChange({ existing_software: software.filter((_, i) => i !== index) });
  };

  const totalCost = software.reduce((sum, s) => sum + (s.monthly_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-1 block">Current Software Stack</Label>
        <p className="text-xs text-muted-foreground mb-4">
          Add the tools your team currently uses. Cost is optional but helps us give better advice.
        </p>

        {software.length > 0 && (
          <div className="space-y-2 mb-4">
            {software.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-card border border-border/60 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.monthly_cost != null && (
                    <span className="text-sm font-mono font-medium">${s.monthly_cost}/mo</span>
                  )}
                  <button
                    onClick={() => removeSoftware(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {totalCost > 0 && (
              <div className="flex justify-end px-4 pt-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Total: <span className="text-foreground font-mono">${totalCost.toLocaleString()}/mo</span>
                </span>
              </div>
            )}
          </div>
        )}

        <div className="bg-muted/50 border border-border/60 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Tool name (e.g. Slack)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSoftware())}
              className="h-10 rounded-lg"
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Input
              placeholder="Monthly cost ($)"
              type="number"
              min={0}
              value={draft.monthly_cost}
              onChange={(e) => setDraft({ ...draft, monthly_cost: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSoftware())}
              className="h-10 rounded-lg"
            />
          </div>
          <Button
            onClick={addSoftware}
            disabled={!draft.name.trim()}
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tool
          </Button>
        </div>
      </div>

      {data.user_type === "startup" && software.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">No existing tools? No problem — we'll recommend a fresh stack.</p>
          <p className="text-xs mt-1">You can skip this step if you're starting from zero.</p>
        </div>
      )}
    </div>
  );
}