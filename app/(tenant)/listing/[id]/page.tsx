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
      security_deposit,
      beds,
      baths,
      area_sqm,
      city,
      area,
      address,
      lat,
      lng,
      is_uni_hub,
      is_premium,
      property_type,
      furnished_type,
      utilities_included,
      ac_type,
      pets_policy,
      amenities,
      move_in_special,
      move_in_special_desc,
      manager_user_id,
      agency_id,
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

  // Fetch manager profile for "Meet your manager" section
  let managerProfile: { full_name: string; manager_type: string } | null = null;
  let agencyName: string | null = null;

  if (listing.manager_user_id) {
    const { data: mp } = await supabase
      .from("rental_manager_profiles")
      .select("full_name, manager_type")
      .eq("user_id", listing.manager_user_id)
      .single();
    managerProfile = mp;
  }

  if (listing.agency_id) {
    const { data: ag } = await supabase
      .from("agencies")
      .select("name")
      .eq("id", listing.agency_id)
      .single();
    agencyName = ag?.name ?? null;
  }

  const listingForClient = {
    ...listing,
    manager_profile: managerProfile,
    agency_name: agencyName,
  };

  return (
    <ListingDetailContent
      listing={listingForClient}
      saved={saved}
      isLoggedIn={!!user}
    />
  );
}
