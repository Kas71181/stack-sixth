import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Clock, CheckCircle2, MessageSquare, UserCircle, AlertCircle, Pencil, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ACTION_META = {
  created:       { Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  updated:       { Icon: Pencil,       color: "text-primary",     bg: "bg-primary/10" },
  status_changed:{ Icon: ArrowRight,   color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20" },
  assigned:      { Icon: UserCircle,   color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-900/20" },
  approved:      { Icon: ShieldCheck,  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  rejected:      { Icon: AlertCircle,  color: "text-destructive", bg: "bg-destructive/10" },
  comment_added: { Icon: MessageSquare,color: "text-primary",     bg: "bg-primary/10" },
  deleted:       { Icon: Trash2,       color: "text-destructive", bg: "bg-destructive/10" },
};

function TimelineEvent({ event }) {
  const meta = ACTION_META[event.action] || ACTION_META.updated;
  const Icon = meta.Icon;
  const ago = event.created_date ? formatDistanceToNow(new Date(event.created_date), { addSuffix: true }) : "";

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        </div>
        <div className="w-px flex-1 bg-border/50 mt-1 group-last:hidden" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold">
            <span className="text-foreground">{event.actor_name || "System"}</span>
            {" "}
            <span className="font-normal text-muted-foreground capitalize">{event.action.replace("_", " ")}</span>
            {event.entity_label && <span className="font-medium text-foreground"> {event.entity_label}</span>}
          </p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">{ago}</span>
        </div>
        {(event.old_value || event.new_value) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {event.old_value && <span className="text-[10px] line-through text-muted-foreground">{event.old_value}</span>}
            {event.old_value && event.new_value && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            {event.new_value && <span className="text-[10px] font-medium text-foreground">{event.new_value}</span>}
          </div>
        )}
        {event.note && (
          <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{event.note}"</p>
        )}
      </div>
    </div>
  );
}

export default function AuditTrailPanel({ entityType, entityId, title }) {
  const { user } = useAuth();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["audit-trail", entityType, entityId],
    queryFn: () => base44.entities.AuditTrailEvent.filter({ entity_id: entityId, entity_type: entityType }, "-created_date", 50),
    enabled: !!entityId,
  });

  if (isLoading) return (
    <div className="py-4 flex justify-center">
      <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-2">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
        </div>
      )}
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No history yet.</p>
      ) : (
        <div>
          {events.map((e) => <TimelineEvent key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}