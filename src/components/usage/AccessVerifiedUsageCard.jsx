import { CheckCircle2, ShieldCheck } from "lucide-react";
import ToolLogo from "@/components/stack/ToolLogo";

export default function AccessVerifiedUsageCard({ tool }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-start">
      <div className="w-16 flex-shrink-0 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-100 text-lg font-bold text-blue-600">—</div>
        <span className="mt-1 block text-[9px] leading-tight text-muted-foreground">Usage unavailable</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <ToolLogo name={tool.tool_name} />
            <div><p className="truncate text-sm font-semibold">{tool.tool_name}</p><p className="text-xs text-muted-foreground">{tool.category}</p></div>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            <CheckCircle2 className="h-3 w-3" /> Verified access
          </span>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Apollo account access is verified. Apollo OAuth does not provide team activity data, so Stack Sixth does not show an estimated usage score.</p>
        </div>
      </div>
    </div>
  );
}