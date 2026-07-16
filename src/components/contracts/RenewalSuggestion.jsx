import { CalendarSearch, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RenewalSuggestion({ suggestion, confirming, onConfirm }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-3 sm:flex-row sm:items-center">
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2"><CalendarSearch className="h-4 w-4 text-primary" /></div>
      <div className="min-w-0">
        <p className="font-semibold text-sm">{suggestion.vendor_name}</p>
        <p className="text-xs text-muted-foreground">Expected {suggestion.renewal_date} · {suggestion.billing_frequency} · {suggestion.renewal_confidence}% confidence</p>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{suggestion.evidence}</p>
      </div>
    </div>
    <Button size="sm" variant="outline" disabled={confirming} onClick={() => onConfirm(suggestion)} className="gap-1.5"><Check className="h-3.5 w-3.5" />Confirm</Button>
  </div>;
}