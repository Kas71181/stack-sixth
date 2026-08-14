import { ArrowRight, BellRing, FileSearch, Inbox } from "lucide-react";

const steps = [
  { icon: Inbox, title: "Bring it in", text: "Upload, connect or enter a renewal." },
  { icon: FileSearch, title: "Governance finds the details", text: "Dates, notice periods and auto-renewal terms." },
  { icon: BellRing, title: "You stay ahead", text: "Review deadlines before renewal happens." },
];
export default function RenewalWorkflow() {
  return <div className="mt-8 grid items-center gap-3 border-t border-border pt-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
    {steps.map(({ icon: Icon, title, text }, index) => <div key={title} className="contents">
      <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs font-bold">{title}</p><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{text}</p></div></div>
      {index < 2 && <ArrowRight className="mx-auto hidden h-4 w-4 text-muted-foreground/50 sm:block" />}
    </div>)}
  </div>;
}