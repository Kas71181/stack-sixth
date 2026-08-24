import { useEffect, useState } from "react";
import { Headphones } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import SupportConversationList from "@/components/support/SupportConversationList";

export default function SupportInbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  useEffect(() => {
    if (user?.role !== "admin") return;
    base44.entities.SupportConversation.list("-created_date", 100).then(setConversations);
    const unsubscribe = base44.entities.SupportConversation.subscribe(() => base44.entities.SupportConversation.list("-created_date", 100).then(setConversations));
    return unsubscribe;
  }, [user?.role]);

  if (user?.role !== "admin") return <div className="glass-card p-10 text-center"><p className="font-semibold">Admin access required</p></div>;
  return <div className="max-w-4xl mx-auto space-y-6">
    <div><h1 className="text-page flex items-center gap-2"><Headphones className="w-6 h-6 text-primary" />Support inbox</h1><p className="text-sm text-muted-foreground mt-1">Join live conversations with users who asked for help.</p></div>
    <SupportConversationList conversations={conversations} />
  </div>;
}