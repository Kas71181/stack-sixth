import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { X, Plus, Trash2, Target, TrendingDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const OUTCOME_STYLES = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-50 text-amber-700 border border-amber-200",
  won: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  lost: "bg-red-50 text-red-600 border border-red-200",
};

export default function NegotiationPlaybookModal({ contract, onClose }) {
  const { user } = useAuth();
  const [playbook, setPlaybook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vendor_name: contract.vendor_name,
    contract_id: contract.id,
    competitor_alternatives: [],
    usage_leverage: "",
    budget_constraint: "",
    target_discount_pct: "",
    walk_away_price: "",
    talking_points: [],
    outcome: "pending",
    actual_discount_pct: "",
    notes: "",
  });
  const [newAlt, setNewAlt] = useState("");
  const [newPoint, setNewPoint] = useState("");

  useEffect(() => {
    base44.entities.NegotiationPlaybook.filter({ contract_id: contract.id }).then((results) => {
      if (results.length > 0) {
        const p = results[0];
        setPlaybook(p);
        setForm({ ...form, ...p });
      }
      setLoading(false);
    });
  }, [contract.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      target_discount_pct: form.target_discount_pct ? Number(form.target_discount_pct) : null,
      walk_away_price: form.walk_away_price ? Number(form.walk_away_price) : null,
      actual_discount_pct: form.actual_discount_pct ? Number(form.actual_discount_pct) : null,
    };
    if (playbook) {
      await base44.entities.NegotiationPlaybook.update(playbook.id, data);
      toast.success("Playbook updated");
    } else {
      const created = await base44.entities.NegotiationPlaybook.create(data);
      setPlaybook(created);
      toast.success("Playbook created");
    }
    setSaving(false);

    // Log audit trail
    await base44.entities.AuditTrailEvent.create({
      entity_type: "NegotiationPlaybook",
      entity_id: contract.id,
      entity_label: contract.vendor_name,
      action: playbook ? "updated" : "created",
      actor_name: user?.full_name || "",
      actor_email: user?.email || "",
      new_value: form.outcome,
    });
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="glass-strong w-full max-w-lg rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Negotiation Playbook</h2>
            <p className="text-xs text-muted-foreground">{contract.vendor_name}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Outcome */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outcome</label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {["pending", "in_progress", "won", "lost"].map((o) => (
              <button
                key={o}
                onClick={() => set("outcome", o)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all border ${
                  form.outcome === o ? OUTCOME_STYLES[o] + " ring-2 ring-offset-1 ring-primary/30" : "bg-muted/50 text-muted-foreground border-border/50"
                }`}
              >
                {o.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Targets */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Discount %</label>
            <input
              type="number"
              value={form.target_discount_pct}
              onChange={(e) => set("target_discount_pct", e.target.value)}
              placeholder="e.g. 20"
              className="mt-1 w-full text-sm bg-muted/50 border border-border/60 rounded-xl px-3 py-2 outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Walk-Away Price/mo</label>
            <input
              type="number"
              value={form.walk_away_price}
              onChange={(e) => set("walk_away_price", e.target.value)}
              placeholder="e.g. 500"
              className="mt-1 w-full text-sm bg-muted/50 border border-border/60 rounded-xl px-3 py-2 outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Leverage */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Usage Leverage</label>
          <textarea
            value={form.usage_leverage}
            onChange={(e) => set("usage_leverage", e.target.value)}
            placeholder="e.g. Only 60% of seats active — cite this to justify seat reduction"
            rows={2}
            className="mt-1 w-full text-sm bg-muted/50 border border-border/60 rounded-xl px-3 py-2 outline-none focus:border-primary/50 resize-none"
          />
        </div>

        {/* Competitor alternatives */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Competitor Alternatives to Mention</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5 mb-2">
            {form.competitor_alternatives.map((alt, i) => (
              <span key={i} className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                {alt}
                <button onClick={() => set("competitor_alternatives", form.competitor_alternatives.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newAlt}
              onChange={(e) => setNewAlt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newAlt.trim()) { set("competitor_alternatives", [...form.competitor_alternatives, newAlt.trim()]); setNewAlt(""); } }}
              placeholder="Add alternative (Enter)"
              className="flex-1 text-sm bg-muted/50 border border-border/60 rounded-xl px-3 py-1.5 outline-none focus:border-primary/50"
            />
            <Button size="sm" variant="outline" onClick={() => { if (newAlt.trim()) { set("competitor_alternatives", [...form.competitor_alternatives, newAlt.trim()]); setNewAlt(""); } }}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Talking points */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Talking Points</label>
          <div className="mt-1.5 space-y-1 mb-2">
            {form.talking_points.map((pt, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="flex-1">{pt}</span>
                <button onClick={() => set("talking_points", form.talking_points.filter((_, j) => j !== i))}>
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newPoint}
              onChange={(e) => setNewPoint(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newPoint.trim()) { set("talking_points", [...form.talking_points, newPoint.trim()]); setNewPoint(""); } }}
              placeholder="Add talking point (Enter)"
              className="flex-1 text-sm bg-muted/50 border border-border/60 rounded-xl px-3 py-1.5 outline-none focus:border-primary/50"
            />
            <Button size="sm" variant="outline" onClick={() => { if (newPoint.trim()) { set("talking_points", [...form.talking_points, newPoint.trim()]); setNewPoint(""); } }}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Actual outcome */}
        {(form.outcome === "won" || form.outcome === "lost") && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actual Discount Achieved %</label>
            <input
              type="number"
              value={form.actual_discount_pct}
              onChange={(e) => set("actual_discount_pct", e.target.value)}
              placeholder="e.g. 15"
              className="mt-1 w-full text-sm bg-muted/50 border border-border/60 rounded-xl px-3 py-2 outline-none focus:border-primary/50"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any additional context, rep name, history..."
            rows={2}
            className="mt-1 w-full text-sm bg-muted/50 border border-border/60 rounded-xl px-3 py-2 outline-none focus:border-primary/50 resize-none"
          />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Playbook"}
        </Button>
      </div>
    </div>
  );
}