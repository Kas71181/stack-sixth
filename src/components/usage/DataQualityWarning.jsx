import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DataQualityWarning({ confidence }) {
  if (confidence >= 70) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-300/70 bg-amber-50/90 p-4 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-semibold">Some numbers may be incomplete</p>
        <p className="mt-0.5 text-xs opacity-80">Data reliability is {confidence}%. Connect more tools before using these figures for purchasing or renewal decisions.</p>
      </div>
      <Link to="/data-coverage">
        <Button size="sm" variant="outline" className="w-full gap-1.5 border-amber-400/70 sm:w-auto">
          Review connections <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}