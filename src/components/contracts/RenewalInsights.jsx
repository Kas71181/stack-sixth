import { differenceInDays } from "date-fns";
import { Lightbulb } from "lucide-react";

export default function RenewalInsights({ contracts }) {
  const active = contracts.filter((c) => c.status !== "Cancelled");
  const in30 = active.filter((c) => c.renewal_date && differenceInDays(new Date(`${c.renewal_date}T12:00:00`), new Date()) >= 0 && differenceInDays(new Date(`${c.renewal_date}T12:00:00`), new Date()) <= 30);
  const approaching = in30.reduce((sum, c) => sum + (c.annual_cost || (c.monthly_cost || 0) * 12), 0);
  const auto = active.filter((c) => c.auto_renews).length;
  const insights = [in30.length && `${in30.length} contract${in30.length === 1 ? "" : "s"} renew within 30 days.`, auto && `${auto} subscription${auto === 1 ? " is" : "s are"} set to auto-renew.`, approaching > 0 && `$${Math.round(approaching).toLocaleString()} in software spend is approaching renewal.`].filter(Boolean);
  if (!insights.length) return null;
  return <section className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4"><h3 className="flex items-center gap-2 text-sm font-bold"><Lightbulb className="h-4 w-4 text-primary" />Renewal insights</h3><div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">{insights.map((text) => <p key={text} className="text-xs text-foreground/80">{text}</p>)}</div></section>;
}