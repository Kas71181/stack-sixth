import { useEffect, useState } from "react";
import { Headphones, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import useSupportMessages from "@/hooks/useSupportMessages";
import SupportMessageList from "./SupportMessageList";

export default function LiveSupportChat({ conversation, ownerMode = false }) {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [room, setRoom] = useState(conversation);
  const { messages, sending, send } = useSupportMessages(room, user, ownerMode);
  useEffect(() => {
    const unsubscribe = base44.entities.SupportConversation.subscribe((event) => {
      if (event.id === room.id && event.data) setRoom((current) => ({ ...current, ...event.data }));
    });
    if (ownerMode && room.status === "waiting") {
      base44.entities.SupportConversation.update(room.id, { status: "active", last_message_at: new Date().toISOString() }).then(setRoom);
    }
    return unsubscribe;
  }, [room.id, room.status, ownerMode]);
  const submit = async () => { if (!input.trim()) return; const text = input; setInput(""); await send(text); };

  return <div className="h-full flex flex-col bg-background">
    <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Headphones className="w-4 h-4" /></div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{ownerMode ? room.requester_name || room.requester_email : "Live support"}</p>
        <p className="text-[10px] opacity-75">{room.status === "waiting" ? "Waiting for a specialist to join" : "A specialist is in this conversation"}</p>
      </div>
    </div>
    <SupportMessageList messages={messages} ownerMode={ownerMode} />
    <div className="p-3 border-t border-border flex gap-2">
      <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Type a message..." className="flex-1 min-w-0 text-sm bg-muted rounded-xl px-3 py-2 outline-none border border-transparent focus:border-primary/40" />
      <button onClick={submit} disabled={!input.trim() || sending} aria-label="Send message" className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-[0.96]">{sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}</button>
    </div>
  </div>;
}