import { FileQuestion } from "lucide-react";
import ToolLogo from "@/components/stack/ToolLogo";

const LABELS = {
  observed: "Observed evidence",
  financial: "Financial evidence",
  snapshot: "Point-in-time evidence",
  insufficient: "Not connected",
};

export default function InsufficientEvidenceUsageCard({ tool }) {
  const label = LABELS[tool.source] || "Insufficient evidence";
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ToolLogo name={tool.tool_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{tool.tool_name}</p>
            <p className="text-xs text-muted-foreground">{tool.category}</p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <FileQuestion className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Usage and savings metrics are hidden until Stack Sixth receives verified live activity.</p>
      </div>
    </div>
  );
}