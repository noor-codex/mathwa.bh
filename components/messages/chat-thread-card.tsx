"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ChatThreadWithDetails, SupportThread } from "@/lib/actions/chat";
import { cn } from "@/lib/utils";

type ChatThreadCardProps = {
  thread: ChatThreadWithDetails;
  isArchiveTab?: boolean;
  onArchive?: (threadId: string) => void;
  onUnarchive?: (threadId: string) => void;
  onPin?: (threadId: string, isPinned: boolean) => void;
  onDelete?: (threadId: string) => void;
};

type SupportThreadCardProps = {
  thread: SupportThread;
};

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

// Get listing image URL
function getListingImageUrl(thread: ChatThreadWithDetails): string | null {
  const media = thread.listing?.listing_media?.[0];
  if (!media) return null;
  return media.external_url || (media.storage_path ? `/storage/${media.storage_path}` : null);
}

const SWIPE_THRESHOLD = 80;

export function ChatThreadCard({
  thread,
  isArchiveTab = false,
  onArchive,
  onUnarchive,
  onPin,
  onDelete,
}: ChatThreadCardProps) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    setSwipeOffset(deltaX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      // Action triggered
      if (swipeOffset < 0) {
        // Swiped left - Archive
        if (!isArchiveTab && onArchive) {
          setIsActioning(true);
          onArchive(thread.id);
        }
      } else {
        // Swiped right - Pin/Unpin (or Unarchive in archive tab)
        if (isArchiveTab) {
          if (onUnarchive) {
            setIsActioning(true);
            onUnarchive(thread.id);
          }
        } else if (onPin) {
          setIsActioning(true);
          onPin(thread.id, !thread.is_pinned);
        }
      }
    }
    setSwipeOffset(0);
    touchStartX.current = null;
  }, [swipeOffset, isArchiveTab, onArchive, onUnarchive, onPin, thread.id, thread.is_pinned]);

  const listingImageUrl = getListingImageUrl(thread);
  const counterpartyName = thread.counterparty?.display_name || thread.counterparty?.email || "Unknown";

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Left side - Archive (orange) */}
        <div
          className={cn(
            "flex h-full w-1/2 items-center justify-start pl-4 transition-opacity",
            swipeOffset < -20 ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundColor: "#F97316" }}
        >
          <span
            className="font-semibold text-white"
            style={{ fontFamily: "Figtree", fontSize: 14 }}
          >
            Archive
          </span>
        </div>
        {/* Right side - Pin/Unarchive (blue) */}
        <div
          className={cn(
            "flex h-full w-1/2 items-center justify-end pr-4 transition-opacity",
            swipeOffset > 20 ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundColor: "#3B82F6" }}
        >
          <span
            className="font-semibold text-white"
            style={{ fontFamily: "Figtree", fontSize: 14 }}
          >
            {isArchiveTab ? "Unarchive" : thread.is_pinned ? "Unpin" : "Pin"}
          </span>
        </div>
      </div>

      {/* Main card content */}
      <Link
        href={`/messages/${thread.id}`}
        ref={containerRef}
        className={cn(
          "relative flex items-center gap-3 bg-white p-[10px] transition-transform",
          isActioning && "pointer-events-none opacity-50"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? "transform 0.2s ease-out" : "none",
          borderRadius: 15,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Listing image with agent avatar overlay */}
        <div className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
          {listingImageUrl ? (
            <Image
              src={listingImageUrl}
              alt={thread.listing?.title || "Listing"}
              width={68}
              height={68}
              className="rounded-full object-cover"
              style={{ width: 68, height: 68 }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-full bg-gray-200"
              style={{ width: 68, height: 68 }}
            >
              <span className="text-gray-400 text-xl">?</span>
            </div>
          )}
          {/* Agent avatar overlay - positioned bottom-left */}
          <div
            className="absolute flex items-center justify-center rounded-full border-2 border-white bg-gray-300"
            style={{ width: 29, height: 29, left: -2, top: -2 }}
          >
            <span
              className="font-semibold text-gray-600"
              style={{ fontFamily: "Figtree", fontSize: 11 }}
            >
              {counterpartyName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ height: 72 }}>
          {/* Name */}
          <span
            className="truncate font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
          >
            {counterpartyName}
          </span>

          {/* Last message preview */}
          <span
            className="truncate font-normal text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 12, lineHeight: "14px" }}
          >
            {thread.last_message_preview || "No messages yet"}
          </span>

          {/* Listing title */}
          <span
            className="truncate font-medium text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 13, lineHeight: "16px" }}
          >
            {thread.listing?.title || "Unknown listing"}
          </span>

          {/* Price */}
          <span
            className="font-bold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
          >
            {thread.listing?.price_monthly ? `${thread.listing.price_monthly} BD` : "Price TBD"}
          </span>
        </div>

        {/* Right side - Time and pin indicator */}
        <div className="flex flex-shrink-0 flex-col items-end gap-[25px]" style={{ width: 85 }}>
          <span
            className="font-medium text-[#707072]"
            style={{ fontFamily: "Figtree", fontSize: 10, lineHeight: "12px" }}
          >
            {formatRelativeTime(thread.last_message_at)}
          </span>
          {thread.is_pinned && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z"
                fill="#3B82F6"
              />
            </svg>
          )}
        </div>
      </Link>
    </div>
  );
}

// Mathwa Support card
export function SupportThreadCard({ thread }: SupportThreadCardProps) {
  return (
    <Link
      href={`/messages/support/${thread.id}`}
      className="flex items-center gap-3 bg-white p-[10px]"
      style={{ borderRadius: 15 }}
    >
      {/* Mathwa logo */}
      <div
        className="flex flex-shrink-0 items-center justify-center rounded-full bg-[#1A1A1A]"
        style={{ width: 68, height: 68 }}
      >
        <svg width="41" height="45" viewBox="0 0 41 45" fill="none">
          <path
            d="M20.5 0L41 12.5V32.5L20.5 45L0 32.5V12.5L20.5 0Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Content */}
      <div
        className="flex min-w-0 flex-1 flex-row flex-wrap items-start gap-0"
        style={{ height: 68 }}
      >
        {/* Name */}
        <span
          className="font-semibold text-[#1A1A1A]"
          style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
        >
          Mathwa Support
        </span>

        {/* Last message preview */}
        <span
          className="w-full font-normal text-[#717182]"
          style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
        >
          {thread.last_message_preview || "Your issue has been resolved"}
        </span>
      </div>

      {/* Right side - Time */}
      <div className="flex flex-shrink-0 flex-col items-end" style={{ width: 85 }}>
        <span
          className="font-medium text-[#707072]"
          style={{ fontFamily: "Figtree", fontSize: 10, lineHeight: "12px" }}
        >
          {formatRelativeTime(thread.last_message_at)}
        </span>
      </div>
    </Link>
  );
}
