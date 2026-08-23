import { differenceInDays, format, subDays } from "date-fns";
import { CalendarClock, Database, DollarSign, RotateCw } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import RenewalDecisionPanel from "@/components/contracts/RenewalDecisionPanel";
import ToolLogo from "@/components/stack/ToolLogo";
import DiscountOffer from "@/components/discounts/DiscountOffer";

export default function RenewalDetailSheet({ contract, open, onOpenChange, onUpdated, discount }) {
  if (!contract) return null;
  const renewal = contract.renewal_date ? new Date(`${contract.renewal_date}T12:00:00`) : null;
  const days = renewal ? differenceInDays(renewal, new Date()) : null;
  const deadline = renewal && contract.notice_period_days ? subDays(renewal, contract.notice_period_days) : null;
  const fields = [
    [CalendarClock, "Renewal date", renewal ? format(renewal, "MMMM d, yyyy") : "Not set"],
    [CalendarClock, "Notice period", contract.notice_period_days ? `${contract.notice_period_days} days` : "Not found"],
    [RotateCw, "Auto-renewal", contract.auto_renews ? "Yes" : "No"],
    [DollarSign, "Contract value", contract.annual_cost ? `$${contract.annual_cost.toLocaleString()} / year` : contract.monthly_cost ? `$${contract.monthly_cost.toLocaleString()} / month` : "Not found"],
    [Database, "Source", contract.renewal_source || "contract"],
    [CalendarClock, "Last reviewed", contract.last_reviewed ? format(new Date(contract.last_reviewed), "MMM d, yyyy") : "Not reviewed"],
  ];
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto sm:max-w-md"><SheetHeader className="pr-8"><div className="flex items-center gap-3"><ToolLogo name={contract.vendor_name} /><div><SheetTitle>{contract.vendor_name}</SheetTitle><SheetDescription>{contract.contract_name || contract.contract_type || "Software subscription"}</SheetDescription></div></div></SheetHeader>
    <div className="mt-6 grid grid-cols-2 gap-3">{fields.map(([Icon, label, value]) => <div key={label} className="rounded-xl border bg-card p-3"><Icon className="h-4 w-4 text-muted-foreground" /><p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 text-xs font-semibold capitalize">{value}</p></div>)}</div>
    {discount && <div className="mt-5"><DiscountOffer offer={discount} /></div>}
    {renewal && <section className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4"><h3 className="text-sm font-bold">Renewal insight</h3><p className="mt-2 text-xs leading-5 text-foreground/80">{contract.vendor_name} renews {days < 0 ? `${Math.abs(days)} days ago` : `in ${days} days`}. {deadline ? `The ${contract.notice_period_days}-day notice window means the decision should be reviewed by ${format(deadline, "MMMM d")}.` : "Review the contract before renewal to avoid an unplanned continuation."}</p></section>}
    <div className="mt-5"><RenewalDecisionPanel contract={contract} onUpdated={onUpdated} /></div>
  </SheetContent></Sheet>;
}