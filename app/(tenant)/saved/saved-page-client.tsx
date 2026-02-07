"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SavedListingCard } from "@/components/listings/saved-listing-card";
import { ViewedListingCard } from "@/components/listings/viewed-listing-card";
import { TourInfoSheet } from "@/components/sheets/tour-info-sheet";
import { BookTourSheet } from "@/components/sheets/book-tour-sheet";
import { SendChatSheet } from "@/components/sheets/send-chat-sheet";
import { TourBookedSheet } from "@/components/sheets/tour-booked-sheet";
import { ChatSentSheet } from "@/components/sheets/chat-sent-sheet";
import { cn } from "@/lib/utils";

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

type ViewedListing = {
  id: string;
  title: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  listing_media?: MediaItem[];
};

type SavedPageClientProps = {
  savedRentals: SavedListing[];
  savedUniHub: SavedListing[];
  viewedRentals: ViewedListing[];
  viewedUniHub: ViewedListing[];
};

type ViewedSortMode = "recent" | "most_viewed";

export function SavedPageClient({
  savedRentals,
  savedUniHub,
  viewedRentals,
  viewedUniHub,
}: SavedPageClientProps) {
  const [activeTab, setActiveTab] = useState<"uni_hub" | "rentals">("rentals");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [viewedSortMode, setViewedSortMode] = useState<ViewedSortMode>("recent");

  // Tour info sheet state
  const [tourInfoOpen, setTourInfoOpen] = useState(false);
  const [tourInfoData, setTourInfoData] = useState<{
    listingTitle: string;
    tourDate: Date;
    lat: number | null;
    lng: number | null;
  } | null>(null);

  // Book tour sheet state
  const [bookTourOpen, setBookTourOpen] = useState(false);
  const [bookTourListingId, setBookTourListingId] = useState<string | null>(null);
  const [tourBookedOpen, setTourBookedOpen] = useState(false);
  const [bookedTourId, setBookedTourId] = useState<string | null>(null);

  // Chat sheet state
  const [sendChatOpen, setSendChatOpen] = useState(false);
  const [chatListingId, setChatListingId] = useState<string | null>(null);
  const [chatSentOpen, setChatSentOpen] = useState(false);
  const [sentChatThreadId, setSentChatThreadId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((listingId: string) => {
    setExpandedCardId((prev) => (prev === listingId ? null : listingId));
  }, []);

  const handleOpenTourInfo = useCallback(
    (listing: SavedListing, tour: TourRequest) => {
      const tourDate = new Date(tour.rescheduled_slot || tour.requested_slot);
      setTourInfoData({
        listingTitle: listing.title,
        tourDate,
        lat: listing.lat,
        lng: listing.lng,
      });
      setTourInfoOpen(true);
    },
    []
  );

  const handleOpenBookTour = useCallback((listingId: string) => {
    setBookTourListingId(listingId);
    setBookTourOpen(true);
  }, []);

  const handleBookingSuccess = useCallback((tourId: string) => {
    setBookTourOpen(false);
    setBookedTourId(tourId);
    setTourBookedOpen(true);
  }, []);

  const handleOpenChat = useCallback((listingId: string) => {
    setChatListingId(listingId);
    setSendChatOpen(true);
  }, []);

  const handleChatSuccess = useCallback((threadId: string) => {
    setSendChatOpen(false);
    setSentChatThreadId(threadId);
    setChatSentOpen(true);
  }, []);

  const handleViewedSortToggle = useCallback(() => {
    setViewedSortMode((prev) => (prev === "recent" ? "most_viewed" : "recent"));
  }, []);

  // Filter listings based on tab (for now, Uni Hub shows placeholder)
  const isUniHubTab = activeTab === "uni_hub";

  return (
    <div className="flex flex-col bg-white pb-20">
      {/* Tab navigation */}
      <div className="flex h-[60px] items-center justify-center">
        <div className="flex items-center justify-center gap-[30px]">
          {/* Uni Hub tab */}
          <button
            type="button"
            onClick={() => setActiveTab("uni_hub")}
            className="flex flex-col items-center gap-[5px]"
          >
            <span
              className={cn(
                "text-center",
                activeTab === "uni_hub"
                  ? "font-semibold text-[#111111]"
                  : "font-medium text-[#374151]"
              )}
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Uni Hub
            </span>
            <div
              className="h-[3px] w-[29px] rounded-full"
              style={{
                backgroundColor: activeTab === "uni_hub" ? "#111111" : "transparent",
              }}
            />
          </button>

          {/* Rentals tab */}
          <button
            type="button"
            onClick={() => setActiveTab("rentals")}
            className="flex flex-col items-center gap-[5px]"
          >
            <span
              className={cn(
                "text-center",
                activeTab === "rentals"
                  ? "font-semibold text-[#111111]"
                  : "font-medium text-[#374151]"
              )}
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Rentals
            </span>
            <div
              className="h-[3px] w-[29px] rounded-full"
              style={{
                backgroundColor: activeTab === "rentals" ? "#111111" : "transparent",
              }}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      {isUniHubTab ? (
        // Uni Hub content
        savedUniHub.length === 0 ? (
          // Empty state for Uni Hub
          <div className="flex flex-col items-start gap-5 px-5 pt-5">
            <h1
              className="font-bold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 32, lineHeight: "38px" }}
            >
              You currently have no saved Uni Hub listings.
            </h1>
            <p
              className="font-normal text-[#717182]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Save Uni Hub listings to see them here.
            </p>
            <Link
              href="/discover?tab=uni_hub"
              className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
            >
              <span
                className="font-bold text-white"
                style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
              >
                View Uni Hub
              </span>
            </Link>
          </div>
        ) : (
          // Uni Hub saved listings
          <div className="flex flex-col gap-5 px-5">
            {/* My saved properties section */}
            <div className="flex flex-col gap-[5.5px]">
              <div className="flex items-center justify-between">
                <h2
                  className="font-semibold text-[#1A1A1A]"
                  style={{
                    fontFamily: "Figtree",
                    fontSize: 25,
                    lineHeight: "28px",
                    letterSpacing: "-0.44px",
                  }}
                >
                  My saved properties
                </h2>
                <button
                  type="button"
                  className="font-normal text-[#1A1A1A]"
                  style={{
                    fontFamily: "Figtree",
                    fontSize: 15,
                    lineHeight: "28px",
                    letterSpacing: "-0.44px",
                  }}
                >
                  Sort by
                </button>
              </div>

              {/* Saved listing cards */}
              <div className="flex flex-col">
                {savedUniHub.map((listing, index) => (
                  <div key={listing.id}>
                    <SavedListingCard
                      listing={listing}
                      isExpanded={expandedCardId === listing.id}
                      onToggleExpand={() => handleToggleExpand(listing.id)}
                      onOpenTourInfo={(tour) => handleOpenTourInfo(listing, tour)}
                      onOpenBookTour={() => handleOpenBookTour(listing.id)}
                      onOpenChat={() => handleOpenChat(listing.id)}
                    />
                    {index < savedUniHub.length - 1 && (
                      <div
                        className="ml-[99px]"
                        style={{ height: 1, borderBottom: "0.5px solid rgba(60, 60, 67, 0.3)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Previously viewed section */}
            {viewedUniHub.length > 0 && (
              <div className="flex flex-col gap-[5.5px]">
                <div className="flex items-center justify-between">
                  <h2
                    className="font-semibold text-[#1A1A1A]"
                    style={{
                      fontFamily: "Figtree",
                      fontSize: 25,
                      lineHeight: "28px",
                      letterSpacing: "-0.44px",
                    }}
                  >
                    Previously viewed
                  </h2>
                  <button
                    type="button"
                    onClick={handleViewedSortToggle}
                    className="font-normal text-[#1A1A1A]"
                    style={{
                      fontFamily: "Figtree",
                      fontSize: 15,
                      lineHeight: "28px",
                      letterSpacing: "-0.44px",
                    }}
                  >
                    Sort by
                  </button>
                </div>

                {/* Viewed listing cards */}
                <div className="flex flex-col">
                  {viewedUniHub.map((listing, index) => (
                    <div key={listing.id}>
                      <ViewedListingCard listing={listing} />
                      {index < viewedUniHub.length - 1 && (
                        <div
                          className="ml-[81px]"
                          style={{ height: 1, borderBottom: "0.5px solid rgba(60, 60, 67, 0.3)" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : savedRentals.length === 0 ? (
        // Empty state for Rentals
        <div className="flex flex-col items-start gap-5 px-5 pt-5">
          <h1
            className="font-bold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 32, lineHeight: "38px" }}
          >
            You currently have no saved Rental listings.
          </h1>
          <p
            className="font-normal text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
          >
            Save Rental listings to see them here.
          </p>
          <Link
            href="/discover"
            className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          >
            <span
              className="font-bold text-white"
              style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
            >
              View Rentals
            </span>
          </Link>
        </div>
      ) : (
        // Rentals content
        <div className="flex flex-col gap-5 px-5">
          {/* My saved properties section */}
          <div className="flex flex-col gap-[5.5px]">
            <div className="flex items-center justify-between">
              <h2
                className="font-semibold text-[#1A1A1A]"
                style={{
                  fontFamily: "Figtree",
                  fontSize: 25,
                  lineHeight: "28px",
                  letterSpacing: "-0.44px",
                }}
              >
                My saved properties
              </h2>
              <button
                type="button"
                className="font-normal text-[#1A1A1A]"
                style={{
                  fontFamily: "Figtree",
                  fontSize: 15,
                  lineHeight: "28px",
                  letterSpacing: "-0.44px",
                }}
              >
                Sort by
              </button>
            </div>

            {/* Saved listing cards */}
            <div className="flex flex-col">
              {savedRentals.map((listing, index) => (
                <div key={listing.id}>
                  <SavedListingCard
                    listing={listing}
                    isExpanded={expandedCardId === listing.id}
                    onToggleExpand={() => handleToggleExpand(listing.id)}
                    onOpenTourInfo={(tour) => handleOpenTourInfo(listing, tour)}
                    onOpenBookTour={() => handleOpenBookTour(listing.id)}
                    onOpenChat={() => handleOpenChat(listing.id)}
                  />
                  {index < savedRentals.length - 1 && (
                    <div
                      className="ml-[99px]"
                      style={{ height: 1, borderBottom: "0.5px solid rgba(60, 60, 67, 0.3)" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Previously viewed section */}
          {viewedRentals.length > 0 && (
            <div className="flex flex-col gap-[5.5px]">
              <div className="flex items-center justify-between">
                <h2
                  className="font-semibold text-[#1A1A1A]"
                  style={{
                    fontFamily: "Figtree",
                    fontSize: 25,
                    lineHeight: "28px",
                    letterSpacing: "-0.44px",
                  }}
                >
                  Previously viewed
                </h2>
                <button
                  type="button"
                  onClick={handleViewedSortToggle}
                  className="font-normal text-[#1A1A1A]"
                  style={{
                    fontFamily: "Figtree",
                    fontSize: 15,
                    lineHeight: "28px",
                    letterSpacing: "-0.44px",
                  }}
                >
                  Sort by
                </button>
              </div>

              {/* Viewed listing cards */}
              <div className="flex flex-col">
                {viewedRentals.map((listing, index) => (
                  <div key={listing.id}>
                    <ViewedListingCard listing={listing} />
                    {index < viewedRentals.length - 1 && (
                      <div
                        className="ml-[81px]"
                        style={{ height: 1, borderBottom: "0.5px solid rgba(60, 60, 67, 0.3)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom sheets */}
      {tourInfoData && (
        <TourInfoSheet
          open={tourInfoOpen}
          onOpenChange={setTourInfoOpen}
          listingTitle={tourInfoData.listingTitle}
          tourDate={tourInfoData.tourDate}
          lat={tourInfoData.lat}
          lng={tourInfoData.lng}
        />
      )}

      {bookTourListingId && (
        <BookTourSheet
          open={bookTourOpen}
          onOpenChange={setBookTourOpen}
          listingId={bookTourListingId}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {bookedTourId && bookTourListingId && (
        <TourBookedSheet
          open={tourBookedOpen}
          onOpenChange={setTourBookedOpen}
          listingId={bookTourListingId}
          tourId={bookedTourId}
        />
      )}

      {chatListingId && (
        <SendChatSheet
          open={sendChatOpen}
          onOpenChange={setSendChatOpen}
          listingId={chatListingId}
          onChatSuccess={handleChatSuccess}
        />
      )}

      {sentChatThreadId && chatListingId && (
        <ChatSentSheet
          open={chatSentOpen}
          onOpenChange={setChatSentOpen}
          listingId={chatListingId}
          threadId={sentChatThreadId}
        />
      )}
    </div>
  );
}
