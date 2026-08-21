import { Check, Mail, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingCandidateCard({ candidate, confirming, confirmed, onConfirm }) {
  const money = candidate.amount ? new Intl.NumberFormat(undefined, { style: "currency", currency: candidate.currency || "USD" }).format(candidate.amount) : "No amount found";
  return <div className="rounded-xl border border-border/60 bg-background/50 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 gap-3"><div className="rounded-lg bg-primary/10 p-2">{candidate.source_type === "gmail" ? <Mail className="h-4 w-4 text-primary" /> : <ReceiptText className="h-4 w-4 text-primary" />}</div><div className="min-w-0"><p className="font-semibold">{candidate.vendor_name}</p><p className="truncate text-xs text-muted-foreground">{candidate.subject || candidate.source_label}</p></div></div>
      <Button size="sm" disabled={confirming || confirmed} onClick={() => onConfirm(candidate)}>{confirmed ? <><Check className="h-4 w-4" />Confirmed</> : confirming ? "Saving…" : "Confirm evidence"}</Button>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{[["Amount", money], ["Invoice", candidate.invoice_date || "Not found"], ["Renewal", candidate.renewal_date || "Not found"], ["Confidence", `${candidate.confidence || 0}%`]].map(([label, value]) => <div key={label} className="rounded-lg bg-muted/40 p-2"><p className="text-muted-foreground">{label}</p><p className="mt-0.5 font-semibold">{value}</p></div>)}</div>
  </div>;
}