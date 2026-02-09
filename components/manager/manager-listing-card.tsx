"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ManagerListing = {
  id: string;
  title: string;
  status: string;
  moderation_status: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  city: string | null;
  area: string | null;
  property_type: string;
  is_premium: boolean;
  listing_media: { external_url: string | null; storage_path: string | null }[];
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-gray-100 text-gray-600",
  pending_moderation: "bg-yellow-100 text-yellow-800",
  removed: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  pending_moderation: "Pending Review",
  removed: "Removed",
};

export function ManagerListingCard({
  listing,
}: {
  listing: ManagerListing;
}) {
  const imageUrl =
    listing.listing_media?.[0]?.external_url ??
    listing.listing_media?.[0]?.storage_path ??
    null;

  const location = [listing.area, listing.city].filter(Boolean).join(", ");

  return (
    <Link
      href={`/manager/listings/${listing.id}`}
      className="flex gap-3 rounded-xl border p-3 transition hover:bg-muted/50"
    >
      {/* Thumbnail */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                statusColors[listing.status] ?? "bg-gray-100 text-gray-600"
              )}
            >
              {statusLabels[listing.status] ?? listing.status}
            </span>
            {listing.is_premium && (
              <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                Premium
              </span>
            )}
          </div>
          <h3 className="mt-1 truncate text-sm font-medium">
            {listing.title}
          </h3>
          {location && (
            <p className="truncate text-xs text-muted-foreground">{location}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">
            {listing.property_type}
            {listing.beds != null && ` · ${listing.beds} bed`}
            {listing.baths != null && ` · ${listing.baths} bath`}
          </span>
          {listing.price_monthly != null && (
            <span className="text-sm font-semibold">
              BD {listing.price_monthly}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
