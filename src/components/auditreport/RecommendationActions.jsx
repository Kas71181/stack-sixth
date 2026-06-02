import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, User, MessageSquare, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RecommendationActions({ rec, auditId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [assignee, setAssignee] = useState(rec.assignee || "");
  const [dueDate, setDueDate] = useState(rec.due_date || "");
  const [notes, setNotes] = useState(rec.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Recommendation.update(rec.id, { assignee, due_date: dueDate, notes });
    qc.invalidateQueries({ queryKey: ["recommendations", auditId] });
    setSaving(false);
    setOpen(false);
  };

  const hasData = rec.assignee || rec.due_date || rec.notes;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {hasData ? (
          <span className="flex items-center gap-1 text-primary font-medium">
            <CheckCircle2 className="w-3 h-3" /> Assigned
            {rec.assignee && ` · ${rec.assignee}`}
            {rec.due_date && ` · Due ${rec.due_date}`}
          </span>
        ) : (
          "Assign & track this action"
        )}
      </button>

      {open && (
        <div className="mt-2 p-3 bg-muted/40 rounded-lg border border-border/40 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <User className="w-3 h-3" /> Assignee
              </label>
              <Input
                placeholder="Name or email"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" /> Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3" /> Notes
            </label>
            <textarea
              placeholder="Add context, blockers, or next steps..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-xs rounded-md border border-input bg-background px-3 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-6 text-xs px-3">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}