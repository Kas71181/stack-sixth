import { ArrowRight, CalendarClock, RotateCw } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import ToolLogo from "@/components/stack/ToolLogo";

export default function RenewalRow({ contract, onOpen }) {
  const days = contract.renewal_date ? differenceInDays(new Date(`${contract.renewal_date}T12:00:00`), new Date()) : null;
  const urgency = days === null ? "Date needed" : days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`;
  const status = days !== null && days < 0 ? "Overdue" : contract.needs_confirmation ? "Needs attention" : "Upcoming";
  const value = contract.annual_cost || ((contract.monthly_cost || 0) * 12);
  return <button onClick={() => onOpen(contract)} className="group grid w-full gap-4 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/40 sm:grid-cols-[minmax(180px,1.4fr)_1fr_.8fr_.8fr_auto] sm:items-center">
    <div className="flex min-w-0 items-center gap-3"><ToolLogo name={contract.vendor_name} /><div className="min-w-0"><p className="truncate text-sm font-bold">{contract.vendor_name}</p><p className="truncate text-xs text-muted-foreground">{contract.contract_name || contract.contract_type || "Software subscription"}</p></div></div>
    <div><p className="text-xs font-semibold">{contract.renewal_date ? format(new Date(`${contract.renewal_date}T12:00:00`), "MMM d, yyyy") : "Not set"}</p><p className={`mt-0.5 text-[11px] ${days !== null && days <= 7 ? "text-orange-700" : "text-muted-foreground"}`}><CalendarClock className="mr-1 inline h-3 w-3" />{urgency}</p></div>
    <div><p className="text-xs font-semibold">{contract.auto_renews ? "Yes" : "No"}</p><p className="text-[11px] text-muted-foreground"><RotateCw className="mr-1 inline h-3 w-3" />Auto-renew</p></div>
    <div><p className="text-xs font-semibold">{value ? `$${value.toLocaleString()}/year` : "—"}</p><p className="text-[11px] text-muted-foreground">{status}</p></div>
    <ArrowRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
  </button>;
}