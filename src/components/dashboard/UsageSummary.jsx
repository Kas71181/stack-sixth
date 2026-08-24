import { Activity, ShieldCheck, ShieldAlert, UserX } from "lucide-react";

export default function UsageSummary({ summary }) {
  const items = [
    { label: "Verified usage", value: summary.verifiedUsageApplications, icon: Activity },
    { label: "Partial evidence", value: summary.partialEvidenceApplications, icon: ShieldCheck },
    { label: "Insufficient evidence", value: summary.insufficientEvidenceApplications, icon: ShieldAlert },
    { label: "Dormancy candidates", value: summary.dormantApplications, icon: UserX },
  ];
  return <section className="glass-card p-5"><h2 className="text-base font-bold">What is being used?</h2><div className="mt-4 grid grid-cols-2 gap-4">{items.map(({ label, value, icon: Icon }) => <div key={label}><Icon className="h-4 w-4 text-primary" /><p className="mt-1 font-mono text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>{summary.utilization === null && <p className="mt-4 text-xs text-muted-foreground">Utilization is hidden until usage evidence is complete enough to support it.</p>}</section>;
}