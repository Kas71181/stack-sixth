import { useEffect, useRef } from "react";

export default function SupportMessageList({ messages, ownerMode }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return <div className="flex-1 overflow-y-auto p-4 space-y-3">
    {messages.map((message) => {
      const mine = ownerMode ? message.sender_role === "owner" : message.sender_role === "user";
      if (message.sender_role === "system") return <p key={message.id} className="text-center text-xs text-muted-foreground py-2">{message.content}</p>;
      return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
          <p className="text-[10px] font-semibold opacity-70 mb-1">{message.sender_name}</p>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>;
    })}
    <div ref={endRef} />
  </div>;
}