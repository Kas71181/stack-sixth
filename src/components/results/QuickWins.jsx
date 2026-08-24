import { Zap } from "lucide-react";
import { withoutLongDashes } from "@/lib/textFormatting";

export default function QuickWins({ wins }) {
  if (!wins?.length) return null;

  return (
    <div className="bg-accent/50 border border-primary/10 rounded-2xl p-5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        Quick Wins
      </h3>
      <ul className="space-y-2">
        {wins.map((w, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            {withoutLongDashes(w)}
          </li>
        ))}
      </ul>
    </div>
  );
}