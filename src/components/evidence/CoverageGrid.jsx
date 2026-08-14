const labels = { inventory: "Inventory", access: "Access", usage: "Usage", spend: "Spend", contract: "Contract" };

export default function CoverageGrid({ coverage }) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {Object.entries(labels).map(([key, label]) => (
        <div key={key} className="glass-card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
            <span className="font-mono text-sm font-bold">{coverage?.[key] || 0}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${coverage?.[key] || 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}