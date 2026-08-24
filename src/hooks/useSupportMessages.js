import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useSupportMessages(conversation, user, ownerMode) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!conversation?.id) return;
    base44.entities.SupportMessage.filter({ conversation_id: conversation.id }, "created_date", 200).then(setMessages);
    const unsubscribe = base44.entities.SupportMessage.subscribe((event) => {
      if (event.data?.conversation_id !== conversation.id) return;
      setMessages((current) => event.type === "create" ? [...current, event.data] : current);
    });
    return unsubscribe;
  }, [conversation?.id]);

  const send = async (content) => {
    if (!content.trim() || sending) return;
    setSending(true);
    await base44.entities.SupportMessage.create({
      conversation_id: conversation.id,
      members: [conversation.requester_id, conversation.owner_id].filter(Boolean),
      sender_id: user.id,
      sender_name: user.full_name || user.email,
      sender_role: ownerMode ? "owner" : "user",
      content: content.trim(),
    });
    if (ownerMode && conversation.status === "waiting") {
      await base44.entities.SupportConversation.update(conversation.id, { status: "active", last_message_at: new Date().toISOString() });
    }
    setSending(false);
  };

  return { messages, sending, send };
}