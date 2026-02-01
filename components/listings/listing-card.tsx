"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark02Icon } from "@hugeicons/core-free-icons";
import { toggleSave } from "@/lib/actions/listings";

type Listing = {
  id: string;
  title: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  city: string | null;
  is_featured: boolean;
  is_uni_hub: boolean;
  listing_media?: { external_url: string | null; storage_path: string | null }[];
  saved?: boolean;
};

export function ListingCard({ listing }: { listing: Listing }) {
  const imageUrl =
    listing.listing_media?.[0]?.external_url ||
    listing.listing_media?.[0]?.storage_path ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";

  return (
    <Card className="overflow-hidden p-0" size="sm">
      <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized={imageUrl.startsWith("http") && !imageUrl.includes("unsplash.com")}
          />
          <div className="absolute left-2 top-2 flex gap-1">
            {listing.is_featured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
            {listing.is_uni_hub && (
              <Badge variant="outline" className="text-xs">
                Uni Hub
              </Badge>
            )}
          </div>
          <form
            action={toggleSave}
            className="absolute right-2 top-2"
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
        <div className="p-3">
          <p className="font-semibold line-clamp-1">{listing.title}</p>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0 text-muted-foreground text-sm">
            {listing.price_monthly != null && (
              <span className="font-medium text-foreground">
                {listing.price_monthly} BHD/mo
              </span>
            )}
            {listing.beds != null && <span>{listing.beds} bed</span>}
            {listing.baths != null && <span>{listing.baths} bath</span>}
            {listing.city && <span>{listing.city}</span>}
          </div>
        </div>
      </Link>
    </Card>
  );
}
