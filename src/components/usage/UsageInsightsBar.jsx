import { DollarSign, Users, AlertTriangle, Layers } from "lucide-react";

/**
 * Surfaces the 4 highest-impact derived metrics at the top of Usage Analytics:
 * - Cost-per-Active-User (CPAU)
 * - Seat utilization %
 * - Overlap / consolidation flags
 * - Renewal risk (low util + renewal soon)
 */
export default function UsageInsightsBar({ tools, contracts = [] }) {
  // ── Cost per Active User ──────────────────────────────────────────
  const toolsWithCost = tools.filter(
    (t) => t.license_cost_per_month > 0 && (t.active_users > 0 || (t.liveUsers || []).filter((u) => u.status === "Active").length > 0)
  );
  const cpauList = toolsWithCost.map((t) => {
    const activeCount =
      t.liveUsers?.length > 0
        ? t.liveUsers.filter((u) => u.status === "Active").length
        : t.active_users || 1;
    const totalCost =
      t.licensed_seats > 0
        ? t.license_cost_per_month * t.licensed_seats
        : t.license_cost_per_month;
    return { name: t.tool_name, cpau: Math.round(totalCost / activeCount) };
  }).sort((a, b) => b.cpau - a.cpau);
  const worstCpau = cpauList[0] || null;

  // ── Seat utilization ─────────────────────────────────────────────
  const toolsWithSeats = tools.filter((t) => t.licensed_seats > 0);
  const avgUtil = toolsWithSeats.length
    ? Math.round(
        toolsWithSeats.reduce((s, t) => {
          const active = t.liveUsers?.length > 0
            ? t.liveUsers.filter((u) => u.status === "Active").length
            : t.active_users || 0;
          return s + (active / t.licensed_seats) * 100;
        }, 0) / toolsWithSeats.length
      )
    : null;

  // ── Category overlap ─────────────────────────────────────────────
  const catMap = {};
  tools.forEach((t) => {
    if (!t.category) return;
    if (!catMap[t.category]) catMap[t.category] = [];
    catMap[t.category].push(t.tool_name);
  });
  const overlaps = Object.entries(catMap).filter(([, names]) => names.length >= 2);

  // ── Renewal risk ─────────────────────────────────────────────────
  const today = new Date();
  const renewalRisks = contracts
    .filter((c) => {
      if (!c.renewal_date) return false;
      const days = Math.ceil((new Date(c.renewal_date) - today) / (1000 * 60 * 60 * 24));
      const toolRecord = tools.find((t) => t.tool_name?.toLowerCase() === c.vendor_name?.toLowerCase());
      const util = toolRecord
        ? (toolRecord.liveUsers?.length > 0
            ? (toolRecord.liveUsers.filter((u) => u.status === "Active").length / toolRecord.liveUsers.length) * 100
            : toolRecord.activity_score || 100)
        : 100;
      return days >= 0 && days <= 60 && util < 50;
    })
    .map((c) => {
      const days = Math.ceil((new Date(c.renewal_date) - today) / (1000 * 60 * 60 * 24));
      return { name: c.vendor_name, days };
    })
    .sort((a, b) => a.days - b.days);

  const insights = [
    worstCpau && {
      icon: DollarSign,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/40",
      label: "Highest Cost / Active User",
      value: `${worstCpau.name} — $${worstCpau.cpau.toLocaleString()}/user`,
    },
    avgUtil !== null && {
      icon: Users,
      color: avgUtil >= 70 ? "text-emerald-600" : avgUtil >= 40 ? "text-amber-600" : "text-destructive",
      bg: avgUtil >= 70
        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/40"
        : avgUtil >= 40
        ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/40"
        : "bg-destructive/5 border-destructive/20",
      label: "Avg Seat Utilization",
      value: `${avgUtil}% of licensed seats active`,
    },
    overlaps.length > 0 && {
      icon: Layers,
      color: "text-violet-600",
      bg: "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700/40",
      label: "Consolidation Opportunity",
      value: overlaps
        .slice(0, 2)
        .map(([cat, names]) => `${names.slice(0, 2).join(" + ")} (${cat})`)
        .join(" · "),
    },
    renewalRisks.length > 0 && {
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/40",
      label: "Renewal Risk",
      value: `${renewalRisks[0].name} renews in ${renewalRisks[0].days}d — low utilization`,
    },
  ].filter(Boolean);

  if (!insights.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {insights.map(({ icon: Icon, color, bg, label, value }) => (
        <div key={label} className={`flex items-start gap-2.5 border rounded-xl px-3.5 py-2.5 ${bg}`}>
          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</p>
            <p className="text-xs text-foreground font-medium mt-0.5 truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}