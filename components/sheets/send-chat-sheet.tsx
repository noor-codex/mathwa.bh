"use client";

import { useState, useCallback } from "react";
import { ActionBottomSheet } from "@/components/ui/action-bottom-sheet";

type SendChatSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  onChatSuccess: (threadId: string) => void;
};

const QUICK_QUESTIONS = [
  "What is the security deposit?",
  "Are there any other fees?",
  "What lease durations are there?",
];

export function SendChatSheet({
  open,
  onOpenChange,
  listingId,
  onChatSuccess,
}: SendChatSheetProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickQuestion = useCallback((question: string) => {
    setMessage(question);
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const { sendChatMessage } = await import("@/lib/actions/chat");
      const result = await sendChatMessage(listingId, message.trim());

      if (result.success && result.threadId) {
        setMessage("");
        onChatSuccess(result.threadId);
        onOpenChange(false);
      } else {
        console.error("Send message failed:", result.error);
      }
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ActionBottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center gap-5">
        {/* Header */}
        <div className="flex w-full flex-col items-start gap-0">
          <h2
            className="font-extrabold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
          >
            Send a chat
          </h2>
          <p
            className="font-bold text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
          >
            We&apos;ll send your chat directly to the listing owner.
          </p>
        </div>

        {/* Text area */}
        <div className="w-full">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Begin your chat here..."
            className="w-full resize-none rounded-[10px] border border-[#E5E7EB] p-[10px] font-normal text-[#1A1A1A] placeholder:text-[#717182] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            style={{
              fontFamily: "Figtree",
              fontSize: 13,
              lineHeight: "16px",
              height: 146,
              backgroundColor: "rgba(229, 231, 235, 0.5)",
            }}
          />
        </div>

        {/* Quick question chips */}
        <div className="flex w-full flex-wrap gap-[5px]">
          {QUICK_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => handleQuickQuestion(question)}
              className="rounded-[10px] border border-[#E5E7EB] bg-[#F2F3F5] px-[10px] py-[5px] font-semibold text-[#717182] transition-colors hover:bg-[#E5E7EB]"
              style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
            >
              {question}
            </button>
          ))}
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isSubmitting || !message.trim()}
          className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] disabled:opacity-50"
        >
          <span
            className="font-bold text-white"
            style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
          >
            {isSubmitting ? "Sending..." : "Send"}
          </span>
        </button>
      </div>
    </ActionBottomSheet>
  );
}
