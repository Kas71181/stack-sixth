import { Trash2, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["Communication","Project Management","CRM & Sales","Productivity & Docs","Analytics & BI","Marketing","Customer Support","Identity & Security","Dev Tools","Finance & HR","Other"];

const SOURCE_BADGE = { stripe: "Stripe", google: "Google", csv: "CSV", manual: "Manual" };

export default function StepReviewImport({ tools, onToolsChange }) {
  const remove = (i) => onToolsChange(tools.filter((_, idx) => idx !== i));
  const update = (i, key, val) => {
    const updated = [...tools];
    updated[i] = { ...updated[i], [key]: val };
    onToolsChange(updated);
  };

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <Tag className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-medium text-sm">No tools imported yet</p>
        <p className="text-xs mt-1">Go back and connect at least one source, or skip to add tools manually.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Review and edit imported tools before saving. <span className="font-medium text-foreground">{tools.length} tools</span> ready to import.</p>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {tools.map((t, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted/40 border border-border/40 rounded-xl px-3 py-2">
            <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
              <Input
                value={t.tool_name || ""}
                onChange={(e) => update(i, "tool_name", e.target.value)}
                className="h-7 text-xs"
                placeholder="Tool name"
              />
              <select
                value={t.category || "Other"}
                onChange={(e) => update(i, "category", e.target.value)}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <Input
                value={t.monthly_cost || ""}
                onChange={(e) => update(i, "monthly_cost", parseFloat(e.target.value) || 0)}
                type="number"
                className="h-7 text-xs"
                placeholder="$/mo"
              />
            </div>
            {t.source && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium flex-shrink-0">
                {SOURCE_BADGE[t.source] || t.source}
              </span>
            )}
            <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Total estimated spend: <span className="font-mono font-semibold text-foreground">${tools.reduce((s, t) => s + (t.monthly_cost || 0), 0).toLocaleString()}/mo</span></p>
    </div>
  );
}