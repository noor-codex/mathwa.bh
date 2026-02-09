"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  senderUserId: string;
  messageType: string;
  body: string | null;
  payload: any;
  createdAt: string;
};

type ThreadInfo = {
  id: string;
  listingTitle: string;
  tenantName: string;
  isArchived: boolean;
};

export function ManagerChatThread({
  thread,
  messages: initialMessages,
  currentUserId,
  threadId,
}: {
  thread: ThreadInfo;
  messages: Message[];
  currentUserId: string;
  threadId: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!newMessage.trim()) return;

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          thread_id: threadId,
          sender_user_id: currentUserId,
          message_type: "text",
          body: newMessage.trim(),
        })
        .select("id, sender_user_id, message_type, body, payload, created_at")
        .single();

      if (!error && data) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            senderUserId: data.sender_user_id,
            messageType: data.message_type,
            body: data.body,
            payload: data.payload,
            createdAt: data.created_at,
          },
        ]);

        // Update thread preview
        await supabase
          .from("chat_threads")
          .update({
            last_message_at: data.created_at,
            last_message_preview: data.body?.substring(0, 100),
          })
          .eq("id", threadId);
      }

      setNewMessage("");
    });
  }

  function handleQuickAction(type: string) {
    startTransition(async () => {
      const supabase = createClient();

      if (type === "request_info") {
        await supabase.from("chat_messages").insert({
          thread_id: threadId,
          sender_user_id: currentUserId,
          message_type: "structured_payload",
          payload: {
            type: "info_request",
            fields: ["nationality", "cpr", "budget", "move_in_date"],
            message: "Could you please share the following information?",
          },
        });
      } else if (type === "archive") {
        await supabase
          .from("chat_threads")
          .update({ is_archived: true })
          .eq("id", threadId);
        router.push("/manager/messages");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <button
          onClick={() => router.push("/manager/messages")}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back
        </button>
        <div className="flex-1 overflow-hidden">
          <div className="font-medium text-sm truncate">
            {thread.tenantName}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {thread.listingTitle}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderUserId === currentUserId;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                {msg.messageType === "text" && msg.body}
                {msg.messageType === "structured_payload" && (
                  <div className="italic">
                    {msg.payload?.message ?? "Information request sent"}
                  </div>
                )}
                {msg.messageType === "system" && (
                  <div className="text-center text-xs text-muted-foreground">
                    {msg.body}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 px-4 py-2 border-t overflow-x-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction("request_info")}
          disabled={isPending}
        >
          Request Info
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction("archive")}
          disabled={isPending}
        >
          Archive Chat
        </Button>
      </div>

      {/* Input */}
      {!thread.isArchived && (
        <div className="flex gap-2 px-4 py-3 border-t safe-area-pb">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isPending || !newMessage.trim()}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
