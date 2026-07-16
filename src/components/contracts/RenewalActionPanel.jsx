import { BellRing, Check } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function RenewalActionPanel({ reminders, onUpdated }) {
  if (!reminders.length) return null;

  const dismiss = async (id) => {
    await base44.entities.Contract.update(id, { reminder_dismissed: true });
    onUpdated();
  };

  return (
    <section className="glass-card border-amber-300/50 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-amber-200/60 bg-amber-500/10 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center"><BellRing className="w-4 h-4 text-amber-600" /></div>
        <div><h2 className="font-bold text-sm">Reminders needing attention</h2><p className="text-xs text-muted-foreground">{reminders.length} renewal action{reminders.length === 1 ? "" : "s"} due</p></div>
      </div>
      <div className="divide-y divide-border/50">
        {reminders.map((contract) => (
          <div key={contract.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{contract.vendor_name}</p><p className="text-xs text-muted-foreground">Reminder set for {format(new Date(`${contract.reminder_date}T12:00:00`), "MMM d, yyyy")}</p></div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => dismiss(contract.id)}><Check className="w-3.5 h-3.5" />Mark handled</Button>
          </div>
        ))}
      </div>
    </section>
  );
}