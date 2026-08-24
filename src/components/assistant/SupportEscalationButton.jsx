import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Headphones, Loader2 } from "lucide-react";

export default function SupportEscalationButton({ conversation, messages, page, onEscalated, recommended = false }) {
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

  useEffect(() => {
    if (recommended && status === "idle") setConfirming(true);
  }, [recommended, status]);

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

  if (status === "sending") return <p className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Opening live support…</p>;
  if (status === "error") return <button onClick={transfer} className="text-xs font-semibold text-destructive">Couldn’t connect. Try again</button>;
  if (confirming) return <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs"><p className="font-semibold text-foreground">{recommended ? "Still need help? A human can take over." : "Start a live chat with support?"}</p><p className="mt-1 text-muted-foreground">Your recent conversation will be shared so you do not have to repeat yourself.</p><div className="mt-2 flex gap-3"><button onClick={transfer} className="font-semibold text-primary">Talk to a human</button><button onClick={() => setConfirming(false)} className="text-muted-foreground">Not now</button></div></div>;
  return <button onClick={() => setConfirming(true)} disabled={!conversation} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40"><Headphones className="h-3.5 w-3.5" />Talk to a human</button>;
}