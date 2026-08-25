import { CheckCircle2, MousePointerClick, ShieldCheck } from "lucide-react";

const steps = [
  { icon: MousePointerClick, title: "Choose an inventory tool", text: "Every current and future inventory tool appears below." },
  { icon: ShieldCheck, title: "Choose a secure method", text: "Use OAuth, verified API credentials, Gmail evidence, or a private report." },
  { icon: CheckCircle2, title: "Verify and sync", text: "Follow the guided steps, then Stack Sixth records the evidence level." },
];

export default function ConnectionGuide() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, text }, index) => (
        <div key={title} className="glass-card p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs font-bold text-primary">Step {index + 1}</p>
          <p className="mt-1 text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{text}</p>
        </div>
      ))}
    </div>
  );
}