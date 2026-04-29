import { CalendarDays, CheckSquare } from "lucide-react";

export default function NextSteps({ steps }) {
  if (!steps?.length) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-primary" />
        Next 30 Days
      </h3>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <p className="text-sm leading-relaxed">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}