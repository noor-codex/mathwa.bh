"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionBottomSheet } from "@/components/ui/action-bottom-sheet";

type ChatSentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  threadId: string;
};

export function ChatSentSheet({
  open,
  onOpenChange,
  listingId,
  threadId,
}: ChatSentSheetProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteChat = async () => {
    setIsDeleting(true);
    try {
      const { deleteChatThread } = await import("@/lib/actions/chat");
      await deleteChatThread(threadId);
      onOpenChange(false);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ActionBottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center gap-5">
        {/* Checkmark icon */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 80, height: 80 }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 40L33 53L60 26"
              stroke="#1E1E1E"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center gap-[10px]">
          <h2
            className="font-extrabold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
          >
            Message sent!
          </h2>
          <p
            className="text-center font-bold text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
          >
            Successfully sent your message.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3">
          {/* See Chat */}
          <Link
            href={`/messages?listing=${listingId}`}
            className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <span
              className="font-bold text-white"
              style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
            >
              See Chat
            </span>
          </Link>

          {/* View More Listings */}
          <Link
            href="/discover"
            className="flex h-[48px] w-full items-center justify-center rounded-[15px] border border-[#E5E7EB] bg-white"
          >
            <span
              className="font-bold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              View More Listings
            </span>
          </Link>
        </div>

        {/* Delete chat link */}
        <button
          type="button"
          onClick={handleDeleteChat}
          disabled={isDeleting}
          className="font-semibold text-[#717182] disabled:opacity-50"
          style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
        >
          {isDeleting ? "Deleting..." : "Made a mistake? Delete Chat."}
        </button>
      </div>
    </ActionBottomSheet>
  );
}
