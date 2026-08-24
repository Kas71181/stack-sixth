import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PartnerCodeField({ onApply, applied, loading, error }) {
  const [open, setOpen] = useState(Boolean(applied));
  const [code, setCode] = useState("");
  return <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
    <button type="button" onClick={() => setOpen((value) => !value)} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Have a partner or promotional code?</button>
    {open && <div className="mt-3"><div className="flex gap-2"><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter code" className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/20" /><button type="button" onClick={() => onApply(code)} disabled={!code.trim() || loading} className="rounded-xl bg-foreground px-4 text-sm font-bold text-background disabled:opacity-40">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}</button></div>{error && <p className="mt-2 text-xs text-destructive">{error}</p>}</div>}
    {applied && <div className="mt-3 flex gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" /><div><p className="text-sm font-bold">{applied.code_type === "reusable" ? "Reusable" : "Unique"} Access Code Applied</p><p className="mt-0.5 text-xs">You've received {applied.benefit_duration_days ? `${applied.benefit_duration_days} days` : `${applied.benefit_duration_months} months`} of Stack Sixth {applied.eligible_plan.toLowerCase()} at no cost, courtesy of {applied.campaign_name}.</p><p className="mt-2 text-xs"><strong>No card required.</strong> Access ends automatically unless you choose a paid plan.</p></div></div>}
  </div>;
}