"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOptimistic } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { toggleSave } from "@/lib/actions/listings";
import { ContentBottomSheet } from "@/components/ui/content-bottom-sheet";
import { AccountRequiredSheet } from "@/components/sheets/account-required-sheet";
import { BookTourSheet } from "@/components/sheets/book-tour-sheet";
import { TourBookedSheet } from "@/components/sheets/tour-booked-sheet";
import { SendChatSheet } from "@/components/sheets/send-chat-sheet";
import { ChatSentSheet } from "@/components/sheets/chat-sent-sheet";
import { getInitials } from "@/lib/utils";

type MediaItem = {
  external_url: string | null;
  storage_path: string | null;
  order_index?: number;
};

type ListingDetail = {
  id: string;
  title: string;
  description: string | null;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  area_sqm: number | null;
  city: string | null;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  is_featured: boolean;
  is_m2: boolean | null;
  owner_type: "landlord" | "agency";
  listing_media?: MediaItem[] | null;
  landlord_profile?: { display_name: string | null } | null;
  agent_profile?: { display_name: string | null } | null;
  agency?: { name: string } | null;
  amenities?: string[] | null;
};

const PLACEHOLDER_AMENITIES = [
  "Central A/C",
  "Elevator in building",
  "Parking",
  "24/7 Security",
  "Balcony",
  "Gym",
  "Pool",
  "Wifi included",
];

const AMENITY_ICON_MAP: Record<string, string> = {
  "central a/c": "/icons/filters/central-ac.svg",
  "elevator in building": "/icons/filters/Vector-2.svg",
  parking: "/icons/filters/covered-parking.svg",
  "24/7 security": "/icons/filters/concierge-service.svg",
  balcony: "/icons/filters/balcony.svg",
  gym: "/icons/filters/shared-gym.svg",
  pool: "/icons/filters/shared-pool.svg",
  "wifi included": "/icons/filters/Vector-1.svg",
};

function getAmenityIcon(label: string): string {
  const key = label.toLowerCase().trim();
  return AMENITY_ICON_MAP[key] ?? "/icons/filters/central-ac.svg";
}


export function ListingDetailContent({
  listing,
  saved: initialSaved,
  isLoggedIn,
}: {
  listing: ListingDetail;
  saved: boolean;
  isLoggedIn: boolean;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [descriptionSheetOpen, setDescriptionSheetOpen] = useState(false);
  const [amenitiesSheetOpen, setAmenitiesSheetOpen] = useState(false);
  const [saved, setSaved] = useOptimistic(initialSaved);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Booking flow sheets
  const [accountRequiredSheetOpen, setAccountRequiredSheetOpen] = useState(false);
  const [accountRequiredContext, setAccountRequiredContext] = useState<"book_tour" | "chat">("book_tour");
  const [bookTourSheetOpen, setBookTourSheetOpen] = useState(false);
  const [tourBookedSheetOpen, setTourBookedSheetOpen] = useState(false);
  const [bookedTourId, setBookedTourId] = useState<string | null>(null);
  
  // Chat flow sheets
  const [sendChatSheetOpen, setSendChatSheetOpen] = useState(false);
  const [chatSentSheetOpen, setChatSentSheetOpen] = useState(false);
  const [sentChatThreadId, setSentChatThreadId] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const contentCardRef = useRef<HTMLDivElement>(null);
  const swipeThreshold = 40;

  const media = (listing.listing_media ?? []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const imageUrls = media
    .map((m) => m.external_url || m.storage_path || "")
    .filter(Boolean);
  const fallbackUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
  const currentImageUrl = imageUrls[imageIndex] || imageUrls[0] || fallbackUrl;

  const amenitiesList = (listing.amenities && listing.amenities.length > 0)
    ? listing.amenities
    : PLACEHOLDER_AMENITIES;
  const amenitiesToShow = amenitiesList.slice(0, 8);

  // Track scroll progress for header fade effect
  // Progress reaches 1 when the white content card top touches the header bottom
  useEffect(() => {
    const handleScroll = () => {
      const headerHeight = 64; // pt-5 (20px) + button (44px)
      
      if (contentCardRef.current) {
        // Get the white card's current position from viewport top
        const cardTop = contentCardRef.current.getBoundingClientRect().top;
        // Calculate initial card top position (when scrollY = 0)
        const initialCardTop = cardTop + window.scrollY;
        // Distance from initial position to header bottom
        const totalDistance = initialCardTop - headerHeight;
        // Current distance traveled
        const distanceTraveled = window.scrollY;
        // Progress: 0 at start, 1 when card top touches header bottom
        const progress = Math.min(1, Math.max(0, distanceTraveled / totalDistance));
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current == null || imageUrls.length <= 1) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    if (Math.abs(dx) >= swipeThreshold) {
      setImageIndex((i) => {
        if (dx < 0) return Math.min(i + 1, imageUrls.length - 1);
        return Math.max(i - 1, 0);
      });
      touchStartXRef.current = e.touches[0].clientX;
    }
  }, [imageUrls.length]);
  const onTouchEnd = useCallback(() => {
    touchStartXRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    touchStartXRef.current = e.clientX;
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (touchStartXRef.current == null || imageUrls.length <= 1) return;
    const dx = e.clientX - touchStartXRef.current;
    if (Math.abs(dx) >= swipeThreshold) {
      setImageIndex((i) => {
        if (dx < 0) return Math.min(i + 1, imageUrls.length - 1);
        return Math.max(i - 1, 0);
      });
      touchStartXRef.current = e.clientX;
    }
  }, [imageUrls.length]);
  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    touchStartXRef.current = null;
  }, []);

  const ownerName =
    listing.owner_type === "landlord"
      ? listing.landlord_profile?.display_name ?? "—"
      : listing.agent_profile?.display_name ?? "—";
  const companyName =
    listing.owner_type === "landlord" ? "Private owner" : (listing.agency?.name ?? "—");

  const propertyType = listing.beds === 0 ? "studio" : "apartment";

  const handleShare = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: listing.title,
        url: typeof window !== "undefined" ? window.location.href : "",
      }).catch(() => {});
    }
  }, [listing.title]);

  const handleBookTourClick = useCallback(() => {
    if (isLoggedIn) {
      setBookTourSheetOpen(true);
    } else {
      setAccountRequiredContext("book_tour");
      setAccountRequiredSheetOpen(true);
    }
  }, [isLoggedIn]);

  const handleChatClick = useCallback(() => {
    if (isLoggedIn) {
      setSendChatSheetOpen(true);
    } else {
      setAccountRequiredContext("chat");
      setAccountRequiredSheetOpen(true);
    }
  }, [isLoggedIn]);

  const handleBookingSuccess = useCallback((tourId: string) => {
    setBookTourSheetOpen(false);
    setBookedTourId(tourId);
    setTourBookedSheetOpen(true);
  }, []);

  const handleChatSuccess = useCallback((threadId: string) => {
    setSendChatSheetOpen(false);
    setSentChatThreadId(threadId);
    setChatSentSheetOpen(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white pb-32">
      {/* Sticky header - only becomes white when image is fully scrolled out */}
      <div
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-5 pt-5"
        style={{
          backgroundColor: scrollProgress >= 1 ? "#FFFFFF" : "transparent",
          borderBottom: scrollProgress >= 1 ? "0.5px solid #707072" : "none",
          paddingBottom: scrollProgress >= 1 ? 10 : 0,
          transition: "background-color 0.15s ease-out, border-bottom 0.15s ease-out, padding-bottom 0.15s ease-out",
        }}
      >
        {/* Back button */}
        <Link
          href="/discover"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white/20 backdrop-blur-[2.5px]"
          aria-label="Back"
        >
          <Image src="/icons/back-arrow.svg" alt="" width={14} height={14} />
        </Link>

        {/* Center info - only visible when header is white */}
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{
            opacity: scrollProgress >= 1 ? 1 : 0,
            transition: "opacity 0.15s ease-out",
            pointerEvents: scrollProgress >= 1 ? "auto" : "none",
          }}
        >
          <span
            className="max-w-[200px] truncate text-center font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "18px" }}
          >
            {listing.title}
          </span>
          <div className="flex items-center gap-2 text-[#707072]" style={{ fontFamily: "Figtree", fontSize: 12, lineHeight: "16px" }}>
            <span>{listing.beds ?? 0} bed{(listing.beds ?? 0) !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{listing.baths ?? 0} bath{(listing.baths ?? 0) !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Share + Save buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white/20 backdrop-blur-[2.5px]"
          >
            <Image src="/icons/share.svg" alt="" width={17} height={19} />
          </button>
          {isLoggedIn ? (
            <form
              action={async (fd) => {
                setSaved(!saved);
                await toggleSave(fd);
              }}
            >
              <input type="hidden" name="listingId" value={listing.id} />
              <button
                type="submit"
                className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white/20 backdrop-blur-[2.5px]"
                title={saved ? "Unsave" : "Save"}
              >
                <Image
                  src="/icons/bookmark.svg"
                  alt=""
                  width={14}
                  height={17}
                  className={saved ? "brightness-0" : ""}
                />
              </button>
            </form>
          ) : (
            <Link
              href={`/login?redirect=/listing/${listing.id}`}
              className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white/20 backdrop-blur-[2.5px]"
              aria-label="Save"
            >
              <Image src="/icons/bookmark.svg" alt="" width={14} height={17} />
            </Link>
          )}
        </div>
      </div>

      {/* Image carousel */}
      <div
        ref={imageContainerRef}
        className="relative w-full overflow-hidden bg-[#E5E7EB]"
        style={{ height: "min(463px, 70vh)" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <Image
          src={currentImageUrl}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
          unoptimized={currentImageUrl.startsWith("http") && !currentImageUrl.includes("unsplash.com")}
        />

        {/* White overlay that fades in as user scrolls */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${scrollProgress})`,
            transition: "background-color 0.05s ease-out",
          }}
        />

        {/* Pager */}
        {imageUrls.length > 0 && (
          <div
            className="absolute bottom-4 right-4 rounded-[5px] bg-black/50 px-3 py-1.5 backdrop-blur-[2.5px]"
            style={{ opacity: 1 - scrollProgress }}
          >
            <span
              className="font-extrabold text-white"
              style={{ fontFamily: "Figtree", fontSize: 12, lineHeight: "16px" }}
            >
              {imageIndex + 1} / {imageUrls.length}
            </span>
          </div>
        )}
      </div>

      {/* White content card - overlaps image */}
      <div ref={contentCardRef} className="relative z-10 -mt-12 flex flex-1 flex-col rounded-t-[32px] bg-white px-5 pb-6 pt-6">
        <h1
          className="text-center font-bold text-[#1A1A1A]"
          style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "31px" }}
        >
          {listing.title}
        </h1>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
          {listing.is_m2 && (
            <span
              className="flex flex-col items-center justify-center rounded-[15px] bg-white"
              style={{ padding: "5px 20px 0px", height: 31 }}
            >
              <span
                className="font-extrabold text-[#1A1A1A]"
                style={{
                  fontFamily: "Figtree",
                  fontSize: 20,
                  lineHeight: "24px",
                  textShadow: "0px 0px 1px rgba(30, 30, 30, 0.25)",
                }}
              >
                m² listing
              </span>
            </span>
          )}
          {listing.is_featured && (
            <span
              className="flex flex-col items-center justify-center rounded-[15px] bg-white"
              style={{ padding: "5px 20px 0px", height: 29 }}
            >
              <span
                className="font-extrabold text-[#1A1A1A]"
                style={{
                  fontFamily: "Figtree",
                  fontSize: 20,
                  lineHeight: "24px",
                  textShadow: "0px 0px 1px rgba(30, 30, 30, 0.25)",
                }}
              >
                Featured
              </span>
            </span>
          )}
        </div>

        <div className="my-4 w-full border-t border-black/10" />

        {/* Bed / Bath */}
        <div className="flex flex-wrap justify-center gap-5">
          <div className="flex items-center justify-center gap-5 rounded-[15px] px-5 py-2.5">
            <Image src="/icons/bed.svg" alt="" width={30} height={20} className="shrink-0" />
            <span
              className="font-extrabold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "33px" }}
            >
              {listing.beds ?? 0}
            </span>
          </div>
          <div className="flex items-center justify-center gap-5 rounded-[15px] px-5 py-2.5">
            <Image src="/icons/bath.svg" alt="" width={30} height={23} className="shrink-0" />
            <span
              className="font-extrabold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "33px" }}
            >
              {listing.baths ?? 0}
            </span>
          </div>
        </div>

        <div className="my-4 w-full border-t border-black/10" />

        {/* About this [property type] */}
        <section className="flex flex-col gap-2.5 px-0 py-5">
          <h2
            className="font-medium text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "23px" }}
          >
            About this {propertyType}
          </h2>
          {listing.description ? (
            <>
              <p
                className="line-clamp-2 text-center font-normal text-[#707072]"
                style={{
                  fontFamily: "Figtree",
                  fontSize: 14,
                  lineHeight: "18px",
                  letterSpacing: "-0.15px",
                }}
              >
                {listing.description}
              </p>
              <button
                type="button"
                onClick={() => setDescriptionSheetOpen(true)}
                className="self-center font-medium underline text-[#0A0A0A]"
                style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "21px" }}
              >
                Show more
              </button>
            </>
          ) : (
            <p className="text-center text-[#707072]" style={{ fontFamily: "Figtree", fontSize: 14 }}>
              No description provided.
            </p>
          )}
        </section>

        <div className="w-full border-t border-black/10" />

        {/* What this place offers */}
        <section className="flex flex-col gap-2.5 px-0 py-6">
          <h2
            className="font-medium text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "23px" }}
          >
            What this place offers
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {amenitiesToShow.map((label) => (
              <div key={label} className="flex items-center gap-3">
                <Image
                  src={getAmenityIcon(label)}
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <span
                  className="font-normal text-[#1A1A1A]"
                  style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "18px" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAmenitiesSheetOpen(true)}
            className="self-center font-medium text-center underline text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "21px" }}
          >
            Show all amenities
          </button>
        </section>

        <div className="w-full border-t border-black/10" />

        {/* Where you'll live */}
        <section className="flex flex-col gap-2.5 px-0 py-6">
          <h2
            className="font-medium text-[#0A0A0A]"
            style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "23px" }}
          >
            Where you&apos;ll live
          </h2>
          <div className="relative min-h-[256px] w-full overflow-hidden rounded-2xl bg-[#EBF3FF]">
            {listing.lat != null && listing.lng != null && (
              <a
                href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}&z=15`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center font-medium text-[#0A0A0A] underline"
                style={{ fontFamily: "Figtree", fontSize: 14 }}
              >
                View on Google Maps
              </a>
            )}
            <div className="absolute right-4 top-4 flex flex-col gap-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white text-[#0A0A0A]"
                aria-label="Zoom in"
              >
                <span className="text-lg font-medium">+</span>
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-white text-[#0A0A0A]"
                aria-label="Zoom out"
              >
                <span className="text-lg font-medium">−</span>
              </button>
            </div>
          </div>
        </section>

        <div className="w-full border-t border-black/10" />

        {/* Meet your agent / landlord */}
        <section className="flex flex-col gap-4 px-0 py-6">
          <h2
            className="font-semibold text-[#0A0A0A]"
            style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "28px", letterSpacing: "-0.44px" }}
          >
            {listing.owner_type === "landlord" ? "Meet your landlord" : "Meet your agent"}
          </h2>
          <div className="flex items-start gap-4 rounded-2xl border border-transparent px-5 py-1">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#1A1A1A] font-medium" style={{ fontFamily: "Figtree", fontSize: 20 }}>
              {getInitials(ownerName)}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="font-medium text-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "21px" }}
              >
                {ownerName}
              </p>
              <p
                className="font-normal text-[#707072]"
                style={{ fontFamily: "Figtree", fontSize: 12, lineHeight: "16px" }}
              >
                {companyName}
              </p>
              <p
                className="mt-1 font-medium text-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "18px" }}
              >
                4.9 rating
              </p>
            </div>
          </div>
        </section>

        <div className="w-full border-t border-black/10" />

        {/* Mathwa policies */}
        <section className="flex flex-col gap-2.5 px-0 py-6">
          <h2
            className="font-medium text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "23px" }}
          >
            Mathwa policies
          </h2>
          <div className="flex flex-col gap-2">
            {[
              "Viewing & entry rules",
              "Application requirements",
              "Terms & transparency",
            ].map((label) => (
              <Link
                key={label}
                href="#"
                className="flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-4 py-3.5 font-normal text-[#1A1A1A] hover:bg-black/[0.02]"
                style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "18px" }}
              >
                {label}
                <HugeiconsIcon icon={ArrowRight01Icon} className="h-5 w-5 shrink-0 text-[#717182]" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-between bg-white px-5 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)] safe-area-pb">
        {/* Price section */}
        <div
          className="flex flex-col items-start justify-center"
          style={{ paddingTop: 15, width: 131, height: 96 }}
        >
          <span
            className="font-black underline text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 32, lineHeight: "30px" }}
          >
            {listing.price_monthly ?? 0} BD
          </span>
          <span
            className="font-bold text-[#707072]"
            style={{ fontFamily: "Figtree", fontSize: 12, lineHeight: "14px" }}
          >
            monthly
          </span>
        </div>
        {/* Button section */}
        <div
          className="flex flex-col items-center justify-end"
          style={{ paddingTop: 15, gap: 5, width: 160, height: 96 }}
        >
          <button
            type="button"
            onClick={handleBookTourClick}
            className="flex w-40 items-center justify-center rounded-[15px] bg-[#1A1A1A] font-bold text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
            style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px", height: 48, padding: "12px 0" }}
          >
            Book Tour
          </button>
          <button
            type="button"
            onClick={handleChatClick}
            className="w-40 font-bold text-center text-[#707072] underline"
            style={{ fontFamily: "Figtree", fontSize: 12, lineHeight: "14px" }}
          >
            or chat
          </button>
        </div>
      </div>

      {/* Bottom sheets */}
      <ContentBottomSheet
        open={descriptionSheetOpen}
        onOpenChange={setDescriptionSheetOpen}
        title="About this listing"
      >
        <p
          className="whitespace-pre-wrap font-normal text-[#707072]"
          style={{
            fontFamily: "Figtree",
            fontSize: 14,
            lineHeight: "18px",
            letterSpacing: "-0.15px",
          }}
        >
          {listing.description ?? "No description provided."}
        </p>
      </ContentBottomSheet>

      <ContentBottomSheet
        open={amenitiesSheetOpen}
        onOpenChange={setAmenitiesSheetOpen}
        title="What this place offers"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {amenitiesList.map((label) => (
            <div key={label} className="flex items-center gap-3">
              <Image
                src={getAmenityIcon(label)}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              <span
                className="font-normal text-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "18px" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </ContentBottomSheet>

      {/* Booking flow sheets */}
      <AccountRequiredSheet
        open={accountRequiredSheetOpen}
        onOpenChange={setAccountRequiredSheetOpen}
        listingId={listing.id}
        context={accountRequiredContext}
      />

      <BookTourSheet
        open={bookTourSheetOpen}
        onOpenChange={setBookTourSheetOpen}
        listingId={listing.id}
        onBookingSuccess={handleBookingSuccess}
      />

      {bookedTourId && (
        <TourBookedSheet
          open={tourBookedSheetOpen}
          onOpenChange={setTourBookedSheetOpen}
          listingId={listing.id}
          tourId={bookedTourId}
        />
      )}

      {/* Chat flow sheets */}
      <SendChatSheet
        open={sendChatSheetOpen}
        onOpenChange={setSendChatSheetOpen}
        listingId={listing.id}
        onChatSuccess={handleChatSuccess}
      />

      {sentChatThreadId && (
        <ChatSentSheet
          open={chatSentSheetOpen}
          onOpenChange={setChatSentSheetOpen}
          listingId={listing.id}
          threadId={sentChatThreadId}
        />
      )}
    </div>
  );
}
