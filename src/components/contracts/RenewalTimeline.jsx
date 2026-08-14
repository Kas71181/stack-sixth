import { differenceInDays } from "date-fns";

export default function RenewalTimeline({ contracts }) {
  const buckets = [
    { label: "Overdue", test: (d) => d < 0, tone: "bg-red-500", text: "Overdue" },
    { label: "7 days", test: (d) => d >= 0 && d <= 7, tone: "bg-orange-500", text: "Urgent" },
    { label: "30 days", test: (d) => d > 7 && d <= 30, tone: "bg-primary", text: "Upcoming" },
    { label: "90 days", test: (d) => d > 30 && d <= 90, tone: "bg-primary/60", text: "Upcoming" },
    { label: "Later", test: (d) => d > 90, tone: "bg-muted-foreground/40", text: "Later" },
  ];
  const dated = contracts.filter((c) => c.renewal_date && c.status !== "Cancelled").map((c) => ({ ...c, days: differenceInDays(new Date(`${c.renewal_date}T12:00:00`), new Date()) }));
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 className="text-sm font-bold">Renewal timeline</h3><div className="mt-5 grid grid-cols-5 gap-2" aria-label="Renewals by urgency">
    {buckets.map((bucket) => { const items = dated.filter((c) => bucket.test(c.days)); return <div key={bucket.label} className="min-w-0"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${bucket.tone}`} /><span className="text-xs font-semibold">{bucket.label}</span></div><div className="mt-3 h-1 rounded-full bg-muted"><div className={`h-1 rounded-full ${bucket.tone}`} style={{ width: items.length ? "100%" : "0%" }} /></div><p className="mt-2 text-[10px] text-muted-foreground">{items.length} · {bucket.text}</p></div>; })}
  </div></section>;
}