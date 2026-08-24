import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NextActionsSummary({ summary, recommendations, renewals, pendingRequests }) {
  const open = (recommendations || []).filter((item) => item.status === "Open" && item.validation_status !== "suppressed").length;
  const total = open + renewals.length + summary.costsNeedReview + summary.dormantSeats + pendingRequests.length + summary.duplicateApplications;
  const details = [
    summary.costsNeedReview && `${summary.costsNeedReview} cost discrepancy`,
    renewals.length && `${renewals.length} renewal deadline`,
    summary.dormantSeats && `${summary.dormantSeats} dormant seat`,
    summary.duplicateApplications && `${summary.duplicateApplications} duplicate application`,
    pendingRequests.length && `${pendingRequests.length} pending software decision`,
  ].filter(Boolean);
  return <section className="glass-card border-primary/20 bg-primary/5 p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2"><AlertCircle className="h-5 w-5 text-primary" /></div><div><h2 className="text-base font-bold">What should I do now?</h2><p className="mt-1 text-sm text-muted-foreground">{total ? `${total} evidence-backed item${total === 1 ? "" : "s"} need attention.` : "No trusted actions require attention."}</p></div></div>{details.length > 0 && <p className="mt-4 text-xs text-muted-foreground">{details.join(" · ")}</p>}<Link to="/savings?view=recommendations" className="mt-5 inline-block"><Button className="gap-2">Review Actions <ArrowRight className="h-4 w-4" /></Button></Link></section>;
}