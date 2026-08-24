import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, X, Send, Loader2, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ProactiveInsights from "./ProactiveInsights";
import SupportEscalationButton from "./SupportEscalationButton";
import LiveSupportChat from "@/components/support/LiveSupportChat";
import { useAuth } from "@/lib/AuthContext";
import { useLocation } from "react-router-dom";

const PAGE_LABELS = {
  "/": "Dashboard",
  "/audit": "New Audit",
  "/history": "Audit History",
  "/it-dashboard": "IT Manager",
  "/monitoring": "Monitoring",
  "/contracts": "Contract Intelligence",
  "/switch-planner": "Switch Planner",
};

export default function AssistantChat({ audits, recommendations, monitorReports, contracts, userActivity }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [conversationRetry, setConversationRetry] = useState(0);
  const [supportConversation, setSupportConversation] = useState(null);
  const bottomRef = useRef(null);
  const sendTimeoutRef = useRef(null);
  const location = useLocation();
  const { user } = useAuth();

  const buildContextMessage = () => {
    const page = PAGE_LABELS[location.pathname] || location.pathname;
    const completedAudits = (audits || []).filter((a) => a.status === "completed");
    const openRecs = (recommendations || []).filter((r) => r.status === "Open");
    const totalSavings = openRecs.reduce((s, r) => s + (r.estimated_monthly_savings || 0), 0);
    const urgentContracts = (contracts || []).filter((c) => {
      if (!c.renewal_date) return false;
      const days = Math.ceil((new Date(c.renewal_date) - new Date()) / 86400000);
      return days >= 0 && days <= 60;
    });
    const wastedCost = (userActivity || []).filter((u) => u.wasted_cost_flag)
      .reduce((s, u) => s + (u.license_cost_per_month || 0), 0);

    return `## Current Context
**Page the user is on:** ${page}

**Audits:** ${completedAudits.length} completed audit(s)
${completedAudits.slice(0, 5).map((a) => `- ${a.company_name}: ${a.existing_software?.length || 0} tools, ${a.team_size} people, $${a.monthly_budget || 0}/mo budget`).join("\n")}

**Open Recommendations:** ${openRecs.length} open, $${totalSavings.toLocaleString()}/mo total savings identified
${openRecs.slice(0, 5).map((r) => `- [${r.priority}] ${r.tool_name}: ${r.category} — $${r.estimated_monthly_savings || 0}/mo`).join("\n")}

**Contracts expiring in 60 days:** ${urgentContracts.length}
${urgentContracts.slice(0, 3).map((c) => `- ${c.vendor_name}: renews ${c.renewal_date}, $${c.monthly_cost || 0}/mo`).join("\n")}

**Wasted license cost (flagged idle seats):** $${wastedCost.toLocaleString()}/mo across ${(userActivity || []).filter((u) => u.wasted_cost_flag).length} users

**Monitoring reports:** ${(monitorReports || []).length} active monitor(s)

Use this context to give specific, data-driven answers. Reference actual numbers and tool names from above.`;
  };

  useEffect(() => {
    if (!open || conversation) return;
    setConversationError("");
    base44.agents.createConversation({ agent_name: "stack_sixth_assistant" })
      .then((conv) => {
        setConversation(conv);
        setMessages(conv.messages || []);
      })
      .catch(() => setConversationError("The assistant could not start. Please try again."));
  }, [open, conversation, conversationRetry]);

  useEffect(() => {
    if (!open || !user?.id || supportConversation) return;
    base44.entities.SupportConversation.filter({ requester_id: user.id }, "-created_date", 10).then((items) => {
      const active = items.find((item) => item.status === "waiting" || item.status === "active");
      if (active) setSupportConversation(active);
    });
  }, [open, user?.id, supportConversation?.id]);

  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      const nextMessages = data.messages || [];
      setMessages(nextMessages);
      const latest = nextMessages[nextMessages.length - 1];
      if (latest?.role === "assistant" && latest.content) {
        clearTimeout(sendTimeoutRef.current);
        setSending(false);
        setConversationError("");
      }
    });
    return () => {
      unsub();
      clearTimeout(sendTimeoutRef.current);
    };
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || sending) return;
    setSending(true);
    setConversationError("");
    const text = input.trim();
    setInput("");
    const content = `[SYSTEM CONTEXT — use this silently]\n${buildContextMessage()}\n\n[USER QUESTION]\n${text}`;
    clearTimeout(sendTimeoutRef.current);
    sendTimeoutRef.current = setTimeout(() => {
      setSending(false);
      setConversationError("This reply is taking longer than expected. Please try again.");
    }, 45000);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content });
    } catch {
      clearTimeout(sendTimeoutRef.current);
      setSending(false);
      setConversationError("Your message could not be sent. Please try again.");
      setInput(text);
    }
  };

  const displayContent = (message) => {
    if (message.role !== "user") return message.content;
    return message.content?.split("[USER QUESTION]\n").pop() || message.content;
  };

  const visibleMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  return (
    <>
      {/* FAB */}
      <button
        aria-label={open ? "Close assistant" : "Open assistant"}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 left-3 right-3 w-auto max-w-[calc(100vw-1.5rem)] sm:left-auto sm:right-6 sm:w-96 sm:max-w-none z-50 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: "480px" }}>
          {supportConversation ? <LiveSupportChat conversation={supportConversation} /> : <>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">Stack Sixth Assistant</p>
              <p className="text-[10px] opacity-70">Ask me anything about your software stack</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!conversation && (
              <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
                {conversationError ? (
                  <>
                    <p className="text-sm text-muted-foreground">{conversationError}</p>
                    <button onClick={() => setConversationRetry((value) => value + 1)} className="text-sm font-semibold text-primary hover:underline">Try again</button>
                  </>
                ) : <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
              </div>
            )}
            {visibleMessages.length === 0 && conversation && (
              <div className="py-4 space-y-4">
                <div className="text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-primary/30" />
                  <p className="text-sm text-muted-foreground">Hi! I'm your Stack Sixth assistant.</p>
                  <p className="text-xs text-muted-foreground mt-1">Ask me anything, or tap a suggestion below.</p>
                </div>
                <ProactiveInsights
                  audits={audits}
                  recommendations={recommendations}
                  monitorReports={monitorReports}
                  onSelectInsight={(text) => { setInput(text); }}
                />
              </div>
            )}
            {visibleMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.role === "user" ? (
                    <p>{displayContent(msg)}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {displayContent(msg)}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3.5 py-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            {conversation && conversationError && <p className="text-xs text-destructive text-center px-3">{conversationError}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Human support */}
          <div className="px-3 pt-2 border-t border-border">
            <SupportEscalationButton conversation={conversation} messages={visibleMessages} page={PAGE_LABELS[location.pathname] || location.pathname} onEscalated={setSupportConversation} />
          </div>

          {/* Input */}
          <div className="p-3 pt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask anything..."
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none border border-transparent focus:border-primary/40 transition-colors"
            />
            <button
              aria-label="Send message"
              onClick={sendMessage}
              disabled={!input.trim() || sending || !conversation}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          </>}
        </div>
      )}
    </>
  );
}