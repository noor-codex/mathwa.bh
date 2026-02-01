import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ListingDetailActions } from "./listing-detail-actions";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from("listings")
    .select(
      `
      id,
      title,
      description,
      price_monthly,
      beds,
      baths,
      area_sqm,
      city,
      area,
      address,
      is_uni_hub,
      is_featured,
      listing_media(external_url, storage_path, order_index)
    `
    )
    .eq("id", id)
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .single();

  if (!listing) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Listing not found.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/discover">Back to Discover</Link>
        </Button>
      </div>
    );
  }

  const media = (listing.listing_media as { external_url: string | null; storage_path: string | null }[]) || [];
  const imageUrl =
    media[0]?.external_url ||
    media[0]?.storage_path ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";

  let saved = false;
  if (user) {
    const { data } = await supabase
      .from("saved_listings")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .single();
    saved = !!data;
  }

  return (
    <div className="pb-24">
      <div className="relative aspect-[4/3] w-full bg-muted">
        <Image
          src={imageUrl}
          alt={listing.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
            {listing.price_monthly != null && (
              <span className="font-semibold text-foreground">
                {listing.price_monthly} BHD / month
              </span>
            )}
            {listing.beds != null && <span>{listing.beds} bed</span>}
            {listing.baths != null && <span>{listing.baths} bath</span>}
            {listing.area_sqm != null && <span>{listing.area_sqm} m²</span>}
            {listing.city && <span>{listing.city}</span>}
            {listing.area && <span>{listing.area}</span>}
          </div>
        </div>
        {listing.description && (
          <p className="text-muted-foreground">{listing.description}</p>
        )}
        {listing.address && (
          <p className="text-muted-foreground text-sm">{listing.address}</p>
        )}

        <ListingDetailActions
          listingId={listing.id}
          saved={saved}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
