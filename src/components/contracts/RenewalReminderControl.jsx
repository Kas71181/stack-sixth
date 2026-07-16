import { useState } from "react";
import { Bell, CalendarPlus, X } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RenewalReminderControl({ contract, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(contract.reminder_date || "");
  const [saving, setSaving] = useState(false);

  const save = async (reminderDate) => {
    setSaving(true);
    await base44.entities.Contract.update(contract.id, {
      reminder_date: reminderDate,
      reminder_email_sent: false,
      reminder_dismissed: false,
    });
    setSaving(false);
    setEditing(false);
    toast.success(reminderDate ? "Reminder scheduled" : "Reminder removed");
    onUpdated();
  };

  if (!editing) return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 active:scale-[0.98]">
      {contract.reminder_date ? <Bell className="w-3.5 h-3.5" /> : <CalendarPlus className="w-3.5 h-3.5" />}
      {contract.reminder_date ? `Reminder ${format(new Date(`${contract.reminder_date}T12:00:00`), "MMM d")}` : "Set renewal reminder"}
    </button>
  );

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center justify-between"><p className="text-xs font-semibold">Choose reminder date</p><button onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></button></div>
      <Input type="date" value={date} max={contract.renewal_date || undefined} onChange={(event) => setDate(event.target.value)} className="h-8 text-xs" />
      <div className="flex gap-2"><Button size="sm" className="h-7 flex-1" disabled={!date || saving} onClick={() => save(date)}>Save reminder</Button>{contract.reminder_date && <Button size="sm" variant="ghost" className="h-7" disabled={saving} onClick={() => save("")}>Remove</Button>}</div>
      <p className="text-[10px] text-muted-foreground">You’ll see an in-app alert and receive an email on this date.</p>
    </div>
  );
}