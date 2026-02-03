"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
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
  owner_type?: "landlord" | "agency";
  is_featured: boolean;
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

function formatFurnished(furnished_type: string | null | undefined): string {
  if (!furnished_type) return "";
  if (furnished_type === "furnished") return "Furnished";
  if (furnished_type === "semi_furnished") return "Semi furnished";
  if (furnished_type === "not_furnished") return "Not furnished";
  return "";
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [imageIndex, setImageIndex] = useState(0);

  const media = (listing.listing_media ?? []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const imageUrls = media.map(
    (m) => m.external_url || m.storage_path || ""
  ).filter(Boolean);
  const fallbackUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
  const currentImageUrl = imageUrls[imageIndex] || imageUrls[0] || fallbackUrl;

  const bedsLabel = formatBeds(listing.beds);
  const bathsLabel = listing.baths != null ? `${listing.baths} bath` : "";
  const furnishedLabel = formatFurnished(listing.furnished_type);
  const inclusiveLabel = listing.utilities_included != null
    ? (listing.utilities_included ? "Inclusive" : "Exclusive")
    : "";

  const detailParts = [bedsLabel, bathsLabel, furnishedLabel, inclusiveLabel].filter(Boolean);
  const detailLine = detailParts.join(" · ");

  const isAgent = listing.owner_type === "agency";

  return (
    <article className="group">
      <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[30px] bg-[var(--discover-grey)]/10">
          <Image
            src={currentImageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized={currentImageUrl.startsWith("http") && !currentImageUrl.includes("unsplash.com")}
          />

          {/* Top-left: Featured tag */}
          {listing.is_featured && (
            <div className="absolute left-2 top-2">
              <img
                src="/icons/featured-tag.svg"
                alt="Featured"
                className="h-[30px] w-auto"
              />
            </div>
          )}

          {/* Top-right: m² tag (and save button below it) */}
          <div className="absolute right-2 top-2 flex flex-col items-end gap-2">
            {listing.area_sqm != null && (
              <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[var(--discover-black)]">
                {listing.area_sqm} m²
              </span>
            )}
            <form
              action={toggleSave}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <input type="hidden" name="listingId" value={listing.id} />
              <button
                type="submit"
                className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60"
                title={listing.saved ? "Unsave" : "Save"}
                onClick={(e) => e.stopPropagation()}
              >
                <HugeiconsIcon
                  icon={Bookmark02Icon}
                  className={`h-5 w-5 ${listing.saved ? "fill-white" : ""}`}
                />
              </button>
            </form>
          </div>

          {/* Bottom-left: Listed by Agent */}
          {isAgent && (
            <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1">
              <span className="text-xs font-medium text-white">Listed by Agent</span>
            </div>
          )}

          {/* Bottom-center: Page indicator (photo switcher) */}
          {imageUrls.length > 1 && (
            <div
              className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5"
              onClick={(e) => e.preventDefault()}
            >
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                    i === imageIndex ? "bg-white" : "bg-white/40"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImageIndex(i);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-2">
          <p className="font-semibold text-[var(--discover-black)] line-clamp-1">
            {listing.title}
          </p>
          {detailLine && (
            <p className="mt-0.5 text-sm font-normal text-[var(--discover-grey)]">
              {detailLine}
            </p>
          )}
          <div className="mt-1 flex items-baseline gap-1">
            {listing.price_monthly != null && (
              <>
                <span className="font-semibold text-[var(--discover-black)] underline">
                  {listing.price_monthly} BD
                </span>
                <span className="text-sm font-medium text-[var(--discover-grey-muted)]">
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
