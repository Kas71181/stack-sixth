import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import LiveSupportChat from "@/components/support/LiveSupportChat";

export default function SupportRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  useEffect(() => { base44.entities.SupportConversation.get(id).then(setConversation); }, [id]);
  if (!conversation) return <div className="h-96 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  const ownerMode = user?.role === "admin";
  return <div className="max-w-4xl mx-auto space-y-4">
    {ownerMode && <Link to="/support" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" />Support inbox</Link>}
    <div className="glass-card overflow-hidden h-[70vh]"><LiveSupportChat conversation={conversation} ownerMode={ownerMode} /></div>
  </div>;
}