import { Activity, ShieldAlert } from "lucide-react";
import UsageBars from "@/components/evidence/UsageBars";

export default function UsageStatusDisplay({ item }) {
  const status = item.statuses?.usage;
  if (status === "VERIFIED_LIVE") return <UsageBars value={item.usageCoverage} />;
  const observed = status === "OBSERVED";
  const label = observed ? "Observed activity" : status === "VERIFIED_ACCESS" ? "Usage unavailable" : "Awaiting usage evidence";
  const Icon = observed ? Activity : ShieldAlert;
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${observed ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}><Icon className="h-3.5 w-3.5" />{label}</span>;
}