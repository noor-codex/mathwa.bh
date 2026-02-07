"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { updateThreadStatus } from "@/lib/actions/chat";
import type { ChatThreadWithDetails } from "@/lib/actions/chat";
import { cn } from "@/lib/utils";

type ChatDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thread: ChatThreadWithDetails;
};

const CLOSE_ANIMATION_MS = 300;

export function ChatDetailsSheet({
  open,
  onOpenChange,
  thread,
}: ChatDetailsSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isStarred, setIsStarred] = useState(thread.is_starred);
  const [isArchived, setIsArchived] = useState(thread.is_archived);
  const [isMuted, setIsMuted] = useState(thread.is_muted);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onOpenChange(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [isClosing, onOpenChange]);

  // Handle star chat
  const handleStarChat = useCallback(async () => {
    const newValue = !isStarred;
    setIsStarred(newValue);
    await updateThreadStatus(thread.id, { isStarred: newValue });
  }, [isStarred, thread.id]);

  // Handle archive chat
  const handleArchiveChat = useCallback(async () => {
    const newValue = !isArchived;
    setIsArchived(newValue);
    await updateThreadStatus(thread.id, { isArchived: newValue });
    if (newValue) {
      requestClose();
    }
  }, [isArchived, thread.id, requestClose]);

  // Handle mute notifications
  const handleMuteNotifications = useCallback(async () => {
    const newValue = !isMuted;
    setIsMuted(newValue);
    await updateThreadStatus(thread.id, { isMuted: newValue });
  }, [isMuted, thread.id]);

  // Get listing image URL
  const listingImageUrl = (() => {
    const media = thread.listing?.listing_media?.[0];
    if (!media) return null;
    return media.external_url || (media.storage_path ? `/storage/${media.storage_path}` : null);
  })();

  const counterpartyName = thread.counterparty?.display_name || thread.counterparty?.email || "Unknown";

  // Prevent body scroll when open
  if (typeof document !== "undefined") {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  if (!open && !isClosing) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        aria-hidden
        onClick={requestClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-[32px] bg-white",
          isClosing ? "animate-filter-sheet-close" : "animate-filter-sheet-open"
        )}
        style={{
          maxHeight: "90vh",
          boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: "rgba(113, 113, 130, 0.3)" }}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5 overflow-y-auto overscroll-contain px-5 pb-8">
          {/* Header */}
          <h2
            className="font-extrabold text-[#0A0A0A]"
            style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
          >
            Details
          </h2>

          {/* Listing section */}
          <div className="flex flex-col gap-2">
            <h3
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Listing
            </h3>
            <Link
              href={`/listing/${thread.listing_id}`}
              className="flex items-center gap-3 rounded-[10px] bg-white px-[5px] py-0"
            >
              {/* Listing image */}
              <div
                className="flex-shrink-0 overflow-hidden rounded-[14px] bg-gray-200"
                style={{ width: 64, height: 64 }}
              >
                {listingImageUrl ? (
                  <Image
                    src={listingImageUrl}
                    alt={thread.listing?.title || "Listing"}
                    width={64}
                    height={64}
                    className="object-cover"
                    style={{ width: 64, height: 64 }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-gray-400">?</span>
                  </div>
                )}
              </div>

              {/* Listing info */}
              <div className="flex flex-col gap-0.5">
                <span
                  className="font-semibold text-[#1A1A1A]"
                  style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                >
                  {thread.listing?.title || "Unknown listing"}
                </span>
                <span
                  className="font-medium text-[#717182]"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  {thread.listing?.beds ? `${thread.listing.beds} bed` : "Studio"}
                  {thread.listing?.baths ? `, ${thread.listing.baths} bath` : ""}
                </span>
              </div>
            </Link>
          </div>

          {/* Agent section */}
          <div className="flex flex-col gap-2">
            <h3
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              {thread.counterparty_type === "agent" ? "Agent" : "Landlord"}
            </h3>
            <div className="flex items-center gap-4 rounded-[16px] py-0">
              {/* Avatar */}
              <div
                className="flex flex-shrink-0 items-center justify-center rounded-full bg-gray-200"
                style={{ width: 62, height: 64 }}
              >
                <span
                  className="font-semibold text-gray-500"
                  style={{ fontFamily: "Figtree", fontSize: 24 }}
                >
                  {counterpartyName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-col">
                <span
                  className="font-semibold text-[#1A1A1A]"
                  style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
                >
                  {counterpartyName}
                </span>
                <span
                  className="font-normal text-[#707072]"
                  style={{ fontFamily: "Figtree", fontSize: 12, lineHeight: "14px" }}
                >
                  {thread.counterparty_type === "agent"
                    ? "Real Estate Agent"
                    : "Property Owner"}
                </span>
                <span
                  className="font-medium text-[#1A1A1A]"
                  style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
                >
                  4.9 rating
                </span>
              </div>
            </div>
          </div>

          {/* Media section */}
          <div className="flex flex-col gap-2">
            <h3
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Media
            </h3>
            <button
              type="button"
              className="flex items-center justify-between rounded-[16px] bg-white px-4 py-4"
            >
              <div className="flex items-center gap-3">
                {/* Thumbnail placeholders */}
                <div className="flex">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-[10px] border-2 border-white bg-[#ECECF0]"
                      style={{
                        width: 40,
                        height: 40,
                        marginLeft: i > 0 ? -8 : 0,
                      }}
                    />
                  ))}
                </div>
                <span
                  className="font-medium text-[#717182]"
                  style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
                >
                  {thread.listing?.listing_media?.length || 0} photos
                </span>
              </div>
              {/* Chevron */}
              <svg
                width="8"
                height="14"
                viewBox="0 0 8 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L7 7L1 13"
                  stroke="#717182"
                  strokeWidth="1.67"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Chat actions section */}
          <div className="flex flex-col gap-2">
            <h3
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Chat actions
            </h3>
            <div className="flex flex-col gap-2">
              {/* Star chat */}
              <button
                type="button"
                onClick={handleStarChat}
                className="flex items-center gap-3 rounded-[16px] border border-black/10 bg-white px-4"
                style={{ height: 54 }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill={isStarred ? "#FFD700" : "none"}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 1.5L12.4 6.9L18.5 7.6L14 11.8L15.2 17.9L10 15L4.8 17.9L6 11.8L1.5 7.6L7.6 6.9L10 1.5Z"
                    stroke="#717182"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className="font-medium text-[#0A0A0A]"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  {isStarred ? "Unstar chat" : "Star chat"}
                </span>
              </button>

              {/* Archive chat */}
              <button
                type="button"
                onClick={handleArchiveChat}
                className="flex items-center gap-3 rounded-[16px] border border-black/10 bg-white px-4"
                style={{ height: 54 }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4H18V6H2V4ZM3 7H17V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V7ZM8 9V11H12V9H8Z"
                    stroke="#717182"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className="font-medium text-[#0A0A0A]"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  {isArchived ? "Unarchive chat" : "Archive chat"}
                </span>
              </button>

              {/* Mute notifications */}
              <button
                type="button"
                onClick={handleMuteNotifications}
                className="flex items-center gap-3 rounded-[16px] border border-black/10 bg-white px-4"
                style={{ height: 54 }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 2C7.79086 2 6 3.79086 6 6V10L4 12V13H16V12L14 10V6C14 3.79086 12.2091 2 10 2Z"
                    stroke="#717182"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 17C8 18.1046 8.89543 19 10 19C11.1046 19 12 18.1046 12 17"
                    stroke="#717182"
                    strokeWidth="1.67"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {isMuted && (
                    <line
                      x1="3"
                      y1="3"
                      x2="17"
                      y2="17"
                      stroke="#717182"
                      strokeWidth="1.67"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <span
                  className="font-medium text-[#0A0A0A]"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  {isMuted ? "Unmute notifications" : "Mute notifications"}
                </span>
              </button>
            </div>
          </div>

          {/* Support section */}
          <div className="flex flex-col gap-2">
            <h3
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Support
            </h3>
            <div className="flex flex-col gap-2">
              {/* Contact Support */}
              <button
                type="button"
                className="flex items-center rounded-[16px] border border-black/10 bg-white px-4"
                style={{ height: 54 }}
              >
                <span
                  className="font-medium text-[#0A0A0A]"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  Contact Support
                </span>
              </button>

              {/* Report this chat */}
              <button
                type="button"
                className="flex items-center rounded-[16px] border border-black/10 bg-white px-4"
                style={{ height: 54 }}
              >
                <span
                  className="font-bold text-[#FF5D5D]"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  Report this chat
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
