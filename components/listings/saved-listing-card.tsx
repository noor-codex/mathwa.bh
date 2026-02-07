"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark02Icon } from "@hugeicons/core-free-icons";
import { toggleSave } from "@/lib/actions/listings";
import { UnsaveConfirmDialog } from "@/components/ui/unsave-confirm-dialog";

type MediaItem = {
  external_url: string | null;
  storage_path: string | null;
  order_index?: number;
};

type TourRequest = {
  id: string;
  requested_slot: string;
  status: "pending" | "accepted" | "denied" | "rescheduled" | "cancelled";
  rescheduled_slot?: string | null;
};

type SavedListing = {
  id: string;
  title: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  lat: number | null;
  lng: number | null;
  listing_media?: MediaItem[];
  tour_requests?: TourRequest[];
};

type SavedListingCardProps = {
  listing: SavedListing;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenTourInfo: (tour: TourRequest) => void;
  onOpenBookTour: () => void;
  onOpenChat: () => void;
};

function formatBedsLabel(beds: number | null): string {
  if (beds === null) return "";
  if (beds === 0) return "Studio";
  return `${beds} bed${beds > 1 ? "s" : ""}`;
}

function getActiveTour(tours?: TourRequest[]): TourRequest | null {
  if (!tours || tours.length === 0) return null;
  
  // Find pending or accepted tour (not cancelled/denied)
  const activeTour = tours.find(
    (t) => t.status === "pending" || t.status === "accepted" || t.status === "rescheduled"
  );
  
  return activeTour || null;
}

function isPastTour(tour: TourRequest): boolean {
  const tourDate = new Date(tour.rescheduled_slot || tour.requested_slot);
  return tourDate < new Date();
}

function hasCompletedTour(tours?: TourRequest[]): boolean {
  if (!tours || tours.length === 0) return false;
  
  // Check if any tour is past its date or was completed
  return tours.some((t) => {
    if (t.status === "cancelled" || t.status === "denied") return false;
    return isPastTour(t);
  });
}

export function SavedListingCard({
  listing,
  isExpanded,
  onToggleExpand,
  onOpenTourInfo,
  onOpenBookTour,
  onOpenChat,
}: SavedListingCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsaveDialog, setShowUnsaveDialog] = useState(false);

  const media = (listing.listing_media ?? [])
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const imageUrl =
    media[0]?.external_url ||
    media[0]?.storage_path ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";

  const bedsLabel = formatBedsLabel(listing.beds);
  const bathsLabel = listing.baths != null ? `${listing.baths} bath` : "";
  const subtitle = [bedsLabel, bathsLabel].filter(Boolean).join(", ");

  const activeTour = getActiveTour(listing.tour_requests);
  const completedTour = hasCompletedTour(listing.tour_requests);

  const handleUnsaveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUnsaveDialog(true);
  }, []);

  const handleConfirmUnsave = useCallback(async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.set("listingId", listing.id);
    await toggleSave(formData);
    setIsSaving(false);
    setShowUnsaveDialog(false);
  }, [listing.id]);

  // Determine which tour button to show
  let tourButtonContent: React.ReactNode = null;
  let tourButtonStyle: "outlined" | "filled" = "filled";
  let tourButtonAction: () => void = onOpenBookTour;

  if (activeTour && !isPastTour(activeTour)) {
    // Active upcoming tour - show "Your Tour Info"
    tourButtonContent = "Your Tour Info";
    tourButtonStyle = "outlined";
    tourButtonAction = () => onOpenTourInfo(activeTour);
  } else if (completedTour) {
    // Past tour - show "Book Tour Again"
    tourButtonContent = "Book Tour Again";
    tourButtonStyle = "filled";
    tourButtonAction = onOpenBookTour;
  } else {
    // No tour - show "Book Tour"
    tourButtonContent = "Book Tour";
    tourButtonStyle = "filled";
    tourButtonAction = onOpenBookTour;
  }

  return (
    <div className="flex w-full flex-col rounded-[15px] bg-white p-[10px]">
      {/* Main row - clickable to expand */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-[25px] text-left"
      >
        {/* Image */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#E5E7EB]">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized={imageUrl.startsWith("http") && !imageUrl.includes("unsplash.com")}
          />
        </div>

        {/* Text content */}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span
            className="line-clamp-1 font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
          >
            {listing.title}
          </span>
          <span
            className="line-clamp-1 font-medium text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
          >
            {subtitle}
          </span>
        </div>

        {/* Price */}
        <span
          className="shrink-0 font-bold text-[#1A1A1A]"
          style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
        >
          {listing.price_monthly ?? 0} BD
        </span>
      </button>

      {/* Expanded action row */}
      {isExpanded && (
        <div className="mt-3 flex items-center gap-[10px] px-3">
          {/* Bookmark icon */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleUnsaveClick(e);
            }}
            disabled={isSaving}
            className="flex h-10 w-10 items-center justify-center disabled:opacity-50"
          >
            <HugeiconsIcon
              icon={Bookmark02Icon}
              className="pointer-events-none h-[22.5px] w-[17.5px] fill-[#1A1A1A] text-[#1A1A1A]"
            />
          </button>

          {/* Action buttons - pushed to right */}
          <div className="flex flex-1 items-center justify-end gap-[10px]">
            {/* View button */}
            <Link
              href={`/listing/${listing.id}`}
              className="flex h-[29px] items-center justify-center rounded-[10px] border border-[#1A1A1A] bg-white px-[10px] py-[5px]"
            >
              <span
                className="font-medium text-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
              >
                View
              </span>
            </Link>

            {/* Chat button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat();
              }}
              className="flex h-[29px] items-center justify-center rounded-[10px] border border-[#1A1A1A] bg-white px-[10px] py-[5px]"
            >
              <span
                className="font-medium text-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
              >
                Chat
              </span>
            </button>

            {/* Tour button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                tourButtonAction();
              }}
              className={`flex h-[29px] items-center justify-center rounded-[10px] border border-[#1A1A1A] px-[10px] py-[5px] ${
                tourButtonStyle === "filled" ? "bg-[#1A1A1A]" : "bg-white"
              }`}
            >
              <span
                className={`font-medium ${
                  tourButtonStyle === "filled" ? "text-white" : "text-[#1A1A1A]"
                }`}
                style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
              >
                {tourButtonContent}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Unsave confirmation dialog */}
      <UnsaveConfirmDialog
        open={showUnsaveDialog}
        onOpenChange={setShowUnsaveDialog}
        onConfirm={handleConfirmUnsave}
        isLoading={isSaving}
      />
    </div>
  );
}
