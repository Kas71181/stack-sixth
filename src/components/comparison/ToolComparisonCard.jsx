import { BadgeDollarSign, Layers3 } from "lucide-react";

export default function ToolComparisonCard({ tool, baseline }) {
  const difference = baseline == null || tool.monthlyCost == null ? null : tool.monthlyCost - baseline;
  return (
    <article className="glass-card flex min-w-0 flex-col p-5">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{tool.name}</h3><p className="text-xs text-muted-foreground">{tool.category || "Uncategorized"}</p></div><span className="badge-pill bg-primary/10 text-primary">{tool.source}</span></div>
      <div className="mt-5 border-t border-border/60 pt-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><BadgeDollarSign className="h-4 w-4" />Monthly cost</p><p className="mt-2 font-mono text-2xl font-bold">{tool.monthlyCost == null ? "Not available" : `$${tool.monthlyCost.toLocaleString()}`}</p><p className="mt-1 text-xs text-muted-foreground">{tool.priceLabel}</p></div>
      {tool.seatDetail && <p className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm"><Layers3 className="h-4 w-4 text-primary" />{tool.seatDetail}</p>}
      {difference != null && <p className={`mt-4 text-sm font-semibold ${difference <= 0 ? "text-emerald-600" : "text-amber-600"}`}>{difference === 0 ? "Lowest selected monthly cost" : difference < 0 ? `$${Math.abs(difference).toLocaleString()} below baseline` : `$${difference.toLocaleString()} above baseline`}</p>}
    </article>
  );
}