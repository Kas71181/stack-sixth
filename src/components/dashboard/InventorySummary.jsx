import { Boxes, CircleDollarSign, FileText, CalendarClock } from "lucide-react";

export default function InventorySummary({ summary, contracts, upcomingRenewals }) {
  const items = [
    { label: "Applications", value: summary.totalApplications, icon: Boxes },
    { label: "Monthly spend", value: summary.costsNeedReview ? "Under review" : `$${Math.round(summary.currentMonthlySpend || 0).toLocaleString()}`, icon: CircleDollarSign },
    { label: "Contracts tracked", value: contracts.length, icon: FileText },
    { label: "Upcoming renewals", value: upcomingRenewals.length, icon: CalendarClock },
  ];
  return <section className="glass-card p-5"><h2 className="text-base font-bold">What do we have?</h2><div className="mt-4 grid grid-cols-2 gap-4">{items.map(({ label, value, icon: Icon }) => <div key={label}><Icon className="h-4 w-4 text-primary" /><p className="mt-1 font-mono text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>{summary.costsNeedReview > 0 && <p className="mt-4 text-xs font-medium text-amber-700">{summary.costsNeedReview} cost {summary.costsNeedReview === 1 ? "source needs" : "sources need"} review.</p>}</section>;
}