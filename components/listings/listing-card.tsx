"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark02Icon } from "@hugeicons/core-free-icons";
import { toggleSave } from "@/lib/actions/listings";

type MediaItem = {
  external_url: string | null;
  storage_path: string | null;
  order_index?: number;
};

type Listing = {
  id: string;
  title: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  city: string | null;
  area: string | null;
  area_sqm: number | null;
  is_premium: boolean;
  is_uni_hub: boolean;
  listing_media?: MediaItem[];
  saved?: boolean;
  furnished_type?: string | null;
  utilities_included?: boolean | null;
};

function formatBeds(beds: number | null): string {
  if (beds == null) return "";
  if (beds === 0) return "Studio";
  if (beds >= 4) return "4+ bed";
  return `${beds} bed`;
}

function formatFurnishedShort(furnished_type: string | null | undefined): string {
  if (!furnished_type) return "";
  if (furnished_type === "furnished") return "Furnished";
  if (furnished_type === "semi_furnished") return "Semi";
  if (furnished_type === "not_furnished") return "Non";
  return "";
}

const MAX_DOTS = 5;

export function ListingCard({ listing }: { listing: Listing }) {
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const swipeThreshold = 40;

  const media = (listing.listing_media ?? []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const imageUrls = media.map(
    (m) => m.external_url || m.storage_path || ""
  ).filter(Boolean);
  const fallbackUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
  const currentImageUrl = imageUrls[imageIndex] || imageUrls[0] || fallbackUrl;
  const dotsCount = Math.min(imageUrls.length, MAX_DOTS);

  const bedsLabel = formatBeds(listing.beds);
  const bathsLabel = listing.baths != null ? `${listing.baths} bath` : "";
  const furnishedLabel = formatFurnishedShort(listing.furnished_type);
  const inclusiveLabel = listing.utilities_included != null
    ? (listing.utilities_included ? "Inclusive" : "Exclusive")
    : "";

  const detailParts = [bedsLabel, bathsLabel, furnishedLabel, inclusiveLabel].filter(Boolean);
  const detailLine = detailParts.join(" · ");

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

  return (
    <article className="group relative w-full min-w-0">
      <Link href={`/listing/${listing.id}`} className="block w-full min-w-0">
        <div
          className="relative w-full overflow-hidden rounded-[30px] bg-[#E5E7EB] touch-manipulation"
          style={{ aspectRatio: "344 / 288" }}
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
            className="object-cover rounded-[30px]"
            sizes="(max-width: 768px) 100vw, 344px"
            unoptimized={currentImageUrl.startsWith("http") && !currentImageUrl.includes("unsplash.com")}
          />

          {/* Top-left: Tag frame (Premium) */}
          {listing.is_premium && (
            <div className="absolute left-0 top-0 flex flex-row flex-wrap gap-1.5 pl-4 pr-2 pb-2 pt-4 sm:pl-5 sm:pr-2.5 sm:pb-2.5 sm:pt-4">
              <span
                className="flex h-7 w-[90px] flex-none items-center justify-center rounded-[16px] bg-white text-[#1A1A1A] sm:h-[30px] sm:w-[105px]"
                style={{ fontFamily: "Figtree", fontWeight: 500, lineHeight: "16px" }}
              >
                <span className="text-base sm:text-[20px]">Premium</span>
              </span>
            </div>
          )}

          {/* Far right: Save icon (no background, transparent) */}
          <div className="absolute right-0 top-0 p-2 sm:p-2.5">
            <form
              action={toggleSave}
              onClick={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="listingId" value={listing.id} />
              <button
                type="submit"
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-transparent text-white touch-manipulation active:bg-transparent"
                title={listing.saved ? "Unsave" : "Save"}
                onClick={(e) => e.stopPropagation()}
              >
                <HugeiconsIcon
                  icon={Bookmark02Icon}
                  className={`h-7 w-7 ${listing.saved ? "fill-white" : ""}`}
                />
              </button>
            </form>
          </div>

          {/* Bottom-center: Page indicator (max 5 dots) - touch-friendly on mobile */}
          {dotsCount >= 1 && (
            <div
              className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-row items-center justify-center gap-0"
              onClick={(e) => e.preventDefault()}
            >
              {Array.from({ length: dotsCount }).map((_, i) => {
                const isActive = i === Math.min(imageIndex, dotsCount - 1);
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Photo ${i + 1}`}
                    className="flex h-4 w-4 min-w-[16px] flex-shrink-0 items-center justify-center touch-manipulation sm:h-3 sm:w-3 sm:min-w-[12px]"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImageIndex(i);
                    }}
                  >
                    <span
                      className={`block h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details block - comfortable spacing on mobile */}
        <div
          className="flex w-full min-w-0 flex-col items-start overflow-hidden px-0.5 pb-1 pt-3 pl-0.5 pr-1 sm:pt-2.5"
          style={{ paddingRight: 6 }}
        >
          <p
            className="w-full min-w-0 line-clamp-1 font-semibold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: "clamp(16px, 4.5vw, 18px)", lineHeight: "22px" }}
          >
            {listing.title}
          </p>
          {detailLine ? (
            <p
              className="mt-0.5 w-full min-w-0 flex items-center font-normal text-[#707072] line-clamp-1"
              style={{ fontFamily: "Figtree", fontSize: "clamp(14px, 4vw, 16px)", lineHeight: "19px" }}
            >
              {detailLine}
            </p>
          ) : null}
          <div className="mt-1.5 flex w-full min-w-0 items-baseline gap-1 sm:mt-1">
            {listing.price_monthly != null && (
              <>
                <span
                  className="font-bold text-[#1A1A1A] sm:font-extrabold"
                  style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                >
                  {listing.price_monthly} BD
                </span>
                <span
                  className="font-normal text-[#707072]"
                  style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                >
                  monthly
                </span>
              </>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
