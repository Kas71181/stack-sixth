const heights = [10, 18, 13, 24, 16, 21, 14];

export default function UsageMetricCard({ label, value, detail, tone = "primary" }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className={`mt-1 text-[11px] font-medium ${tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>{detail}</p>
        </div>
        <div className="flex h-10 items-end gap-1" aria-hidden="true">
          {heights.map((height, index) => <span key={index} className="w-2 rounded-t-sm bg-primary/20" style={{ height }} />)}
        </div>
      </div>
    </div>
  );
}