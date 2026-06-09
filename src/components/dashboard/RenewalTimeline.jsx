import { Link } from "react-router-dom";
import { CalendarClock, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

function daysBetween(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function RenewalItem({ tool, days }) {
  const urgent = days <= 14;
  const warning = days <= 30;
  const Icon = urgent ? AlertTriangle : warning ? Clock : CheckCircle2;
  const colors = urgent
    ? { bg: "bg-red-50 border-red-200", icon: "text-red-600 bg-red-100", badge: "bg-red-100 text-red-700", bar: "bg-red-400" }
    : warning
    ? { bg: "bg-amber-50 border-amber-200", icon: "text-amber-600 bg-amber-100", badge: "bg-amber-100 text-amber-700", bar: "bg-amber-400" }
    : { bg: "bg-card border-border/60", icon: "text-emerald-600 bg-emerald-50", badge: "bg-muted text-muted-foreground", bar: "bg-emerald-400" };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors.bg}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{tool.name || tool.vendor_name}</p>
        {tool.monthly_cost != null && (
          <p className="text-xs text-muted-foreground">${tool.monthly_cost}/mo</p>
        )}
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${colors.badge}`}>
        {days <= 0 ? "Today" : `${days}d`}
      </span>
    </div>
  );
}

export default function RenewalTimeline({ monitorReports, contracts }) {
  // Collect renewals from monitor reports
  const fromMonitors = (monitorReports || []).flatMap((r) =>
    (r.tools_snapshot || [])
      .filter((t) => t.renewal_date)
      .map((t) => ({ name: t.name, monthly_cost: t.monthly_cost, renewal_date: t.renewal_date }))
  );

  // Collect renewals from contracts
  const fromContracts = (contracts || [])
    .filter((c) => c.renewal_date)
    .map((c) => ({ name: c.vendor_name, monthly_cost: c.monthly_cost, renewal_date: c.renewal_date }));

  // Merge, deduplicate by name, sort by soonest
  const seen = new Set();
  const all = [...fromMonitors, ...fromContracts]
    .filter((t) => {
      const key = (t.name || "").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((t) => ({ ...t, days: daysBetween(t.renewal_date) }))
    .filter((t) => t.days >= 0 && t.days <= 90)
    .sort((a, b) => a.days - b.days);

  if (all.length === 0) return null;

  const buckets = [
    { label: "Next 14 days", color: "text-red-600", items: all.filter((t) => t.days <= 14) },
    { label: "15–30 days", color: "text-amber-600", items: all.filter((t) => t.days > 14 && t.days <= 30) },
    { label: "31–90 days", color: "text-muted-foreground", items: all.filter((t) => t.days > 30) },
  ].filter((b) => b.items.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" />
          Renewal Radar
          <span className="text-xs font-normal text-muted-foreground">(next 90 days)</span>
        </h2>
        <Link to="/contracts" className="text-xs text-primary font-medium hover:underline">
          Manage contracts →
        </Link>
      </div>

      <div className="space-y-4">
        {buckets.map((bucket) => (
          <div key={bucket.label}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${bucket.color}`}>{bucket.label}</p>
            <div className="space-y-2">
              {bucket.items.map((t, i) => (
                <RenewalItem key={i} tool={t} days={t.days} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}