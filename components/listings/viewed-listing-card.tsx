"use client";

import Image from "next/image";
import Link from "next/link";

type MediaItem = {
  external_url: string | null;
  storage_path: string | null;
  order_index?: number;
};

type ViewedListing = {
  id: string;
  title: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  listing_media?: MediaItem[];
};

type ViewedListingCardProps = {
  listing: ViewedListing;
};

function formatBedsLabel(beds: number | null): string {
  if (beds === null) return "";
  if (beds === 0) return "Studio";
  return `${beds} bed${beds > 1 ? "s" : ""}`;
}

export function ViewedListingCard({ listing }: ViewedListingCardProps) {
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

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="flex w-full items-center gap-3 rounded-[10px] bg-white px-[5px] py-0"
      style={{
        height: 90,
      }}
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
        {listing.price_monthly ?? 0} BD/mo
      </span>
    </Link>
  );
}
