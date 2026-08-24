import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Headphones, Loader2 } from "lucide-react";

export default function SupportEscalationButton({ conversation, messages, page, onEscalated }) {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const escalated = messages.some((message) => message.tool_calls?.some((call) =>
      call.name === "transferToLiveAgent" && ["completed", "success"].includes(call.status)
    ));
    if (!escalated) return;
    setStatus("sending");
    base44.entities.SupportConversation.list("-created_date", 10).then((items) => {
      const active = items.find((item) => item.status === "waiting" || item.status === "active");
      if (active) onEscalated(active);
    });
  }, [messages, onEscalated]);

  const transfer = async () => {
    setStatus("sending");
    const recent = messages.filter((message) => message.content).slice(-12);
    const lastUserMessage = [...recent].reverse().find((message) => message.role === "user");
    try {
      const response = await base44.functions.invoke("transferToLiveAgent", {
        conversation_id: conversation?.id,
        page,
        issue_summary: lastUserMessage?.content || "The user requested help from a support specialist.",
        recent_messages: recent.map(({ role, content }) => ({ role, content })),
      });
      onEscalated(await base44.entities.SupportConversation.get(response.data.support_conversation_id));
    } catch {
      setStatus("error");
    }
  };

  if (status === "sending") return <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />Opening live support…</p>;
  if (status === "error") return <button onClick={() => setStatus("idle")} className="text-xs font-semibold text-destructive">Couldn’t connect. Try again</button>;
  if (confirming) return <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Start a live chat with support?</span><button onClick={transfer} className="font-semibold text-primary">Start</button><button onClick={() => setConfirming(false)} className="text-muted-foreground">Cancel</button></div>;
  return <button onClick={() => setConfirming(true)} disabled={!conversation} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"><Headphones className="h-3.5 w-3.5" />Talk to a person</button>;
}