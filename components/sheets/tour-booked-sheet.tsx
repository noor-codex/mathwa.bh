"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionBottomSheet } from "@/components/ui/action-bottom-sheet";

type TourBookedSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  tourId: string;
};

export function TourBookedSheet({
  open,
  onOpenChange,
  listingId,
  tourId,
}: TourBookedSheetProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      const { cancelTourRequest } = await import("@/lib/actions/tours");
      await cancelTourRequest(tourId);
      onOpenChange(false);
    } catch (error) {
      console.error("Cancel error:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <ActionBottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center gap-5">
        {/* Checkmark icon */}
        <div
          className="flex items-center justify-center rounded-full bg-[#1A1A1A]"
          style={{ width: 80, height: 80 }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 20L16 28L32 12"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center gap-1">
          <h2
            className="font-extrabold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
          >
            Tour booked!
          </h2>
          <p
            className="text-center font-bold text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px", maxWidth: 300 }}
          >
            Successfully booked a tour. We&apos;ll let you know if the agent confirms or reschedules the tour!
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3">
          {/* See Booking - navigates to messages thread */}
          <Link
            href={`/messages?listing=${listingId}`}
            className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <span
              className="font-bold text-white"
              style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
            >
              See Booking
            </span>
          </Link>

          {/* View More Listings */}
          <Link
            href="/discover"
            className="flex h-[54px] w-full items-center justify-center rounded-[15px] border border-[#1A1A1A] bg-white"
          >
            <span
              className="font-bold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
            >
              View More Listings
            </span>
          </Link>
        </div>

        {/* Cancel booking link */}
        <button
          type="button"
          onClick={handleCancelBooking}
          disabled={isCancelling}
          className="font-bold text-[#717182] disabled:opacity-50"
          style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
        >
          {isCancelling ? "Cancelling..." : "Made a mistake? Cancel Booking."}
        </button>
      </div>
    </ActionBottomSheet>
  );
}
