import { differenceInDays, isSameMonth } from "date-fns";

export default function RenewalOverviewStrip({ contracts }) {
  const now = new Date();
  const verified = contracts.filter((contract) => contract.needs_confirmation !== true && ["verified", "customer_confirmed"].includes(contract.verification_status));
  const metrics = [
    ["Tracked renewals", contracts.length],
    ["Due this month", verified.filter((c) => c.status !== "Cancelled" && c.renewal_date && isSameMonth(new Date(`${c.renewal_date}T12:00:00`), now)).length],
    ["Needs attention", contracts.filter((c) => {
      if (!c.renewal_date || c.status === "Cancelled" || (c.decision_state && c.decision_state !== "undecided")) return false;
      const days = differenceInDays(new Date(`${c.renewal_date}T12:00:00`), now);
      return c.needs_confirmation || days < 0 || days <= (c.notice_period_days || 7);
    }).length],
    ["Auto-renewals", verified.filter((c) => (c.auto_renewal_status === "yes" || (c.auto_renewal_status == null && c.auto_renews === true)) && c.status !== "Cancelled").length],
  ];
  return <section aria-label="Renewal overview" className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-4">
    {metrics.map(([label, value], index) => <div key={label} className={`px-5 py-4 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""} lg:border-l lg:first:border-l-0`}>
      <p className="text-2xl font-extrabold text-foreground">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>)}
  </section>;
}