import { BadgeDollarSign, CalendarRange, SearchCheck } from "lucide-react";

export default function OpportunitySummary({ summary }) {
  const items = [
    { label: "Annual verified savings", value: `$${Math.round((summary.verifiedSavings || 0) * 12).toLocaleString()}`, icon: BadgeDollarSign },
    { label: "Annual renewal opportunity", value: `$${Math.round((summary.renewalOpportunity || 0) * 12).toLocaleString()}`, icon: CalendarRange },
    { label: "Optimization candidates", value: summary.optimizationCandidates, icon: SearchCheck },
  ];
  return <section className="glass-card p-5"><h2 className="text-base font-bold">Where are the opportunities?</h2><div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">{items.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3"><Icon className="h-4 w-4 text-primary" /><div><p className="font-mono text-lg font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Candidates remain unpriced until usage and cost evidence support a claim.</p></section>;
}