import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ListingDetailContent } from "./listing-detail-content";
import { recordListingView } from "@/lib/actions/listings";

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
      lat,
      lng,
      is_uni_hub,
      is_featured,
      is_m2,
      owner_type,
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

  let saved = false;
  if (user) {
    // Record the listing view for authenticated users
    recordListingView(id);
    
    const { data } = await supabase
      .from("saved_listings")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .single();
    saved = !!data;
  }

  const listingForClient = {
    ...listing,
    landlord_profile: null as { display_name: string | null } | null,
    agent_profile: null as { display_name: string | null } | null,
    agency: null as { name: string } | null,
    amenities: null as string[] | null,
  };

  return (
    <ListingDetailContent
      listing={listingForClient}
      saved={saved}
      isLoggedIn={!!user}
    />
  );
}
