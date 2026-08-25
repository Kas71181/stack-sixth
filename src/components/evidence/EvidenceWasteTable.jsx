import { CheckCircle2, ShieldAlert } from "lucide-react";
import UsageBars from "@/components/evidence/UsageBars";

const label = (value) => (value || "INSUFFICIENT_EVIDENCE").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
const verified = (value) => ["VERIFIED_LIVE", "VERIFIED_ACCESS", "FINANCIAL_EVIDENCE", "CONTRACT_EVIDENCE"].includes(value);

function Status({ value }) {
  const Icon = verified(value) ? CheckCircle2 : ShieldAlert;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground"><Icon className={`h-3.5 w-3.5 ${verified(value) ? "text-primary" : "text-muted-foreground"}`} />{label(value)}</span>;
}

export default function EvidenceWasteTable({ applications }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 px-4 py-4"><h3 className="font-bold">License wastage</h3></div>
      <div className="overflow-x-auto">
        <div className="min-w-[1080px]">
          <div className="grid grid-cols-[36px_1.35fr_1fr_1.1fr_1fr_1fr_1fr_1.25fr] gap-3 border-b border-border/60 bg-muted/30 px-4 py-3 text-xs font-semibold text-muted-foreground"><span>#</span><span>Application name</span><span>License wastage</span><span>Access status</span><span>Usage status</span><span>Financial status</span><span>Contract status</span><span>Evidence confidence</span></div>
          {applications.map((item, index) => {
            const waste = item.dormantSeats > 0 ? `${item.dormantSeats} dormant` : item.unknownSeats > 0 ? "Needs evidence" : "No verified waste";
            const confidenceVerified = item.statuses.usage === "VERIFIED_LIVE";
            const confidence = confidenceVerified ? "Verified data" : "Insufficient evidence";
            const ConfidenceIcon = confidenceVerified ? CheckCircle2 : ShieldAlert;
            return <div key={item.id} className="grid grid-cols-[36px_1.35fr_1fr_1.1fr_1fr_1fr_1fr_1.25fr] items-center gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"><span className="font-mono text-xs">{index + 1}</span><div><p className="text-sm font-semibold">{item.name}</p><p className="text-[10px] text-muted-foreground">Canonical ID: {item.canonicalAppId}</p></div><span className="text-xs font-medium">{waste}</span><Status value={item.statuses.access} /><UsageBars value={item.usageCoverage} /><Status value={item.statuses.financial} /><Status value={item.statuses.contract} /><div className={`border-l-4 pl-2 ${confidenceVerified ? "border-primary" : "border-muted-foreground/30"}`}><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${confidenceVerified ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/60 text-muted-foreground"}`}><ConfidenceIcon className="h-3 w-3" />{confidence}</span></div></div>;
          })}
          {!applications.length && <p className="p-8 text-center text-sm text-muted-foreground">No application evidence is available yet.</p>}
        </div>
      </div>
    </div>
  );
}