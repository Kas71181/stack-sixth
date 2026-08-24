import { Link } from "react-router-dom";
import { ChevronRight, Clock3 } from "lucide-react";

export default function SupportConversationList({ conversations }) {
  if (!conversations.length) return <div className="glass-card p-10 text-center text-sm text-muted-foreground">No support conversations yet.</div>;
  return <div className="glass-card divide-y divide-border/60 overflow-hidden">
    {conversations.map((conversation) => <Link key={conversation.id} to={`/support/${conversation.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/40 active:scale-[0.99]">
      <div className={`w-2 h-2 rounded-full ${conversation.status === "waiting" ? "bg-amber-500" : conversation.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><p className="font-semibold truncate">{conversation.requester_name || conversation.requester_email}</p><span className="badge-pill bg-muted text-muted-foreground">{conversation.status}</span></div>
        <p className="text-sm text-muted-foreground truncate mt-1">{conversation.issue_summary}</p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock3 className="w-3 h-3" />{new Date(conversation.created_date).toLocaleString()}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>)}
  </div>;
}