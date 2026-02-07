"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { sendMessageToThread } from "@/lib/actions/chat";
import { MessageBubble } from "@/components/messages/message-bubble";
import { ChatInput } from "@/components/messages/chat-input";
import { ChatDetailsSheet } from "@/components/sheets/chat-details-sheet";
import type { ChatMessage, ChatThreadWithDetails } from "@/lib/actions/chat";

type ChatViewProps = {
  thread: ChatThreadWithDetails;
  initialMessages: ChatMessage[];
  currentUserId: string;
};

export function ChatView({
  thread,
  initialMessages,
  currentUserId,
}: ChatViewProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get listing image URL
  const listingImageUrl = (() => {
    const media = thread.listing?.listing_media?.[0];
    if (!media) return null;
    return media.external_url || (media.storage_path ? `/storage/${media.storage_path}` : null);
  })();

  const counterpartyName = thread.counterparty?.display_name || thread.counterparty?.email || "Unknown";

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`thread-${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            thread_id: string;
            sender_user_id: string;
            message_type: string;
            body: string | null;
            payload: Record<string, unknown> | null;
            created_at: string;
          };

          // Avoid duplicates (we may have optimistically added this message)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }

            // Add the new message with sender info
            const chatMessage: ChatMessage = {
              id: newMessage.id,
              thread_id: newMessage.thread_id,
              sender_user_id: newMessage.sender_user_id,
              message_type: newMessage.message_type as ChatMessage["message_type"],
              body: newMessage.body,
              payload: newMessage.payload,
              created_at: newMessage.created_at,
              sender: null, // Will be filled in by the server on refresh
            };

            return [...prev, chatMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread.id]);

  // Handle send message
  const handleSend = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isSending) return;

      setIsSending(true);

      // Optimistically add the message
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        thread_id: thread.id,
        sender_user_id: currentUserId,
        message_type: "text",
        body: messageText,
        payload: null,
        created_at: new Date().toISOString(),
        sender: null,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const result = await sendMessageToThread(thread.id, messageText);

        if (!result.success) {
          // Remove optimistic message on failure
          setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
          console.error("Send message failed:", result.error);
        }
      } catch (error) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        console.error("Send message error:", error);
      } finally {
        setIsSending(false);
      }
    },
    [thread.id, currentUserId, isSending]
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    router.push("/messages");
  }, [router]);

  return (
    <div className="flex h-screen flex-col" style={{ background: "#F9F9F9" }}>
      {/* Header - sticky top */}
      <div
        className="sticky top-0 z-10 flex flex-shrink-0 items-end gap-[30px] bg-white px-5 pb-5"
        style={{
          paddingTop: 50,
          height: 128,
          boxShadow: "0px 4px 5px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex items-center gap-[29px]">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="flex h-[52px] items-center justify-center"
          >
            <svg
              width="9"
              height="18"
              viewBox="0 0 9 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 1L1 9L8 17"
                stroke="#0A0A0A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Tappable header content for details sheet */}
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="flex items-center gap-[5px]"
          >
            {/* Agent avatar */}
            <div
              className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200"
              style={{ width: 52, height: 52 }}
            >
              {listingImageUrl ? (
                <Image
                  src={listingImageUrl}
                  alt={counterpartyName}
                  width={52}
                  height={52}
                  className="object-cover"
                  style={{ width: 52, height: 52 }}
                />
              ) : (
                <span
                  className="font-semibold text-gray-500"
                  style={{ fontFamily: "Figtree", fontSize: 20 }}
                >
                  {counterpartyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name and listing info */}
            <div className="flex flex-col items-start justify-center px-[10px]">
              <span
                className="font-semibold text-[#0A0A0A]"
                style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
              >
                {counterpartyName}
              </span>
              <span
                className="font-bold text-[#0A0A0A]"
                style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
              >
                {thread.listing?.price_monthly || "TBD"} BD • {thread.listing?.title || "Listing"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Messages area - scrollable between sticky header and sticky input */}
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4"
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isSent={message.sender_user_id === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input - sticky bottom */}
      <ChatInput onSend={handleSend} disabled={isSending} />

      {/* Chat details bottom sheet */}
      <ChatDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        thread={thread}
      />
    </div>
  );
}
