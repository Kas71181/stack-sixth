import { useState } from "react";
import { ArrowRight, CheckCircle2, RefreshCw, Repeat2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import RenewalResolutionForm from "@/components/contracts/RenewalResolutionForm";

const ACTIONS = [
  { key: "continue", label: "Continue", icon: CheckCircle2 },
  { key: "renegotiate", label: "Renegotiate", icon: RefreshCw },
  { key: "cancel", label: "Cancel", icon: XCircle },
  { key: "replace", label: "Replace", icon: Repeat2 },
];
export default function RenewalDecisionPanel({ contract, onUpdated }) {
  const [action, setAction] = useState(null);
  const decided = contract.decision_state && contract.decision_state !== "undecided";
  if (action) return <RenewalResolutionForm action={action} contract={contract} onBack={() => setAction(null)} onResolved={onUpdated} />;
  return <section className="rounded-xl border border-border bg-muted/20 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{decided ? "Decision recorded" : "Decision needed"}</h3><p className="mt-1 text-xs text-muted-foreground">{decided ? `Current path: ${contract.decision_state}. You can revise it below.` : "Choose a path, then complete the required details to resolve this renewal."}</p></div>{decided && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold capitalize text-primary">{contract.decision_state}</span>}</div>
    <div className="mt-4 grid grid-cols-2 gap-2">{ACTIONS.map(({ key, label, icon: Icon }) => <Button key={key} type="button" size="sm" variant={contract.decision_state === key ? "default" : "outline"} className="justify-between" onClick={() => setAction(key)}><span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</span><ArrowRight className="h-3.5 w-3.5" /></Button>)}</div>
  </section>;
}