import { ShieldCheck, ShieldQuestion } from "lucide-react";

const styles = {
  VERIFIED_LIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300",
  VERIFIED_ACCESS: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-300",
  FINANCIAL_EVIDENCE: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/20 dark:text-violet-300",
  CONTRACT_EVIDENCE: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300",
  OBSERVED: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300",
  DISCOVERED: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
  INSUFFICIENT_EVIDENCE: "border-border bg-muted/50 text-muted-foreground",
};

export default function EvidenceBadge({ value }) {
  const verified = value && !["OBSERVED", "DISCOVERED", "INSUFFICIENT_EVIDENCE"].includes(value);
  const Icon = verified ? ShieldCheck : ShieldQuestion;
  const label = (value || "INSUFFICIENT_EVIDENCE").replaceAll("_", " ").toLowerCase();
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${styles[value] || styles.INSUFFICIENT_EVIDENCE}`}><Icon className="h-3 w-3" />{label}</span>;
}