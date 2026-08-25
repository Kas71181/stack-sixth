import { Check, Clock3, X } from "lucide-react";

const options = [
  { value: "approved", label: "Approve", icon: Check, active: "bg-emerald-600 text-white border-emerald-600" },
  { value: "declined", label: "Decline", icon: X, active: "bg-destructive text-destructive-foreground border-destructive" },
  { value: "deferred", label: "Defer", icon: Clock3, active: "bg-amber-500 text-white border-amber-500" },
];

export default function RecommendationDecision({ value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
      {options.map(({ value: option, label, icon: Icon, active }) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold active:scale-[0.96] disabled:opacity-50 ${value === option ? active : "bg-background/60 text-muted-foreground hover:text-foreground"}`}
        >
          <Icon className="h-3.5 w-3.5" />{label}
        </button>
      ))}
    </div>
  );
}