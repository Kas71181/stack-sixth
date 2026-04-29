import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OverlapFlags({ flags }) {
  if (!flags?.length) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        Overlap Detected
      </h3>
      <div className="space-y-2">
        {flags.map((flag, i) => (
          <div
            key={i}
            className="bg-destructive/5 border border-destructive/15 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
          >
            <div>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {flag.tools?.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs border-destructive/30 text-destructive">
                    {t}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-foreground/80">{flag.reason}</p>
            </div>
            {flag.estimated_monthly_waste != null && (
              <span className="text-sm font-mono font-semibold text-destructive whitespace-nowrap">
                -${flag.estimated_monthly_waste}/mo
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}