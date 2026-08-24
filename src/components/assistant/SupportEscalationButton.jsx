import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Headphones, Loader2 } from "lucide-react";

export default function SupportEscalationButton({ conversation, messages, page }) {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const escalated = messages.some((message) => message.tool_calls?.some((call) =>
      call.name === "transferToLiveAgent" && ["completed", "success"].includes(call.status)
    ));
    if (escalated) setStatus("sent");
  }, [messages]);

  const transfer = async () => {
    setStatus("sending");
    const recent = messages.filter((message) => message.content).slice(-12);
    const lastUserMessage = [...recent].reverse().find((message) => message.role === "user");
    try {
      await base44.functions.invoke("transferToLiveAgent", {
        conversation_id: conversation?.id,
        page,
        issue_summary: lastUserMessage?.content || "The user requested help from a support specialist.",
        recent_messages: recent.map(({ role, content }) => ({ role, content })),
      });
      setStatus("sent");
      setConfirming(false);
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") return <p className="text-xs text-emerald-600 dark:text-emerald-400">Support request sent. A specialist will follow up by email.</p>;
  if (status === "error") return <button onClick={() => setStatus("idle")} className="text-xs font-semibold text-destructive">Couldn’t send. Try again</button>;
  if (confirming) return <div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">Email this conversation to support?</span><button onClick={transfer} disabled={status === "sending"} className="font-semibold text-primary disabled:opacity-50">{status === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}</button><button onClick={() => setConfirming(false)} className="text-muted-foreground">Cancel</button></div>;
  return <button onClick={() => setConfirming(true)} disabled={!conversation} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"><Headphones className="h-3.5 w-3.5" />Talk to a person</button>;
}