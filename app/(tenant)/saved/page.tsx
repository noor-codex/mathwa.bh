import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SavedPageClient } from "./saved-page-client";

type SavedListingType = {
  id: string;
  title: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  lat: number | null;
  lng: number | null;
  is_uni_hub: boolean;
  listing_media?: Array<{
    external_url: string | null;
    storage_path: string | null;
    order_index?: number;
  }>;
  tour_requests?: Array<{
    id: string;
    requested_slot: string;
    status: "pending" | "accepted" | "denied" | "rescheduled" | "cancelled";
    rescheduled_slot?: string | null;
  }>;
};

type ViewedListingType = {
  id: string;
  title: string;
  price_monthly: number | null;
  beds: number | null;
  baths: number | null;
  is_uni_hub: boolean;
  listing_media?: Array<{
    external_url: string | null;
    storage_path: string | null;
    order_index?: number;
  }>;
};

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/saved");
  }

  // Fetch saved listings with tour requests
  const { data: savedRows } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id);

  const savedListingIds = savedRows?.map((r) => r.listing_id) || [];

  let allSavedListings: SavedListingType[] = [];

  if (savedListingIds.length > 0) {
    const { data: listings } = await supabase
      .from("listings")
      .select(
        `
        id,
        title,
        price_monthly,
        beds,
        baths,
        lat,
        lng,
        is_uni_hub,
        listing_media(external_url, storage_path, order_index)
      `
      )
      .in("id", savedListingIds)
      .eq("status", "active")
      .eq("moderation_status", "approved");

    // Fetch tour requests for saved listings
    const { data: tourRequests } = await supabase
      .from("tour_requests")
      .select("id, listing_id, requested_slot, status, rescheduled_slot")
      .eq("tenant_user_id", user.id)
      .in("listing_id", savedListingIds);

    // Group tour requests by listing
    const toursByListing = new Map<string, NonNullable<typeof tourRequests>>();
    tourRequests?.forEach((tour) => {
      const existing = toursByListing.get(tour.listing_id) || [];
      existing.push(tour);
      toursByListing.set(tour.listing_id, existing);
    });

    allSavedListings = (listings || []).map((l) => ({
      ...l,
      tour_requests: toursByListing.get(l.id) || [],
    }));
  }

  // Split saved listings by is_uni_hub
  const savedRentals = allSavedListings.filter((l) => !l.is_uni_hub);
  const savedUniHub = allSavedListings.filter((l) => l.is_uni_hub);

  // Fetch recently viewed listings (last 10 distinct per category)
  const { data: viewRows } = await supabase
    .from("listing_views")
    .select("listing_id, viewed_at")
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(100);

  // Get distinct listing IDs in order
  const seenIds = new Set<string>();
  const viewedListingIds: string[] = [];
  viewRows?.forEach((row) => {
    if (!seenIds.has(row.listing_id) && viewedListingIds.length < 20) {
      seenIds.add(row.listing_id);
      viewedListingIds.push(row.listing_id);
    }
  });

  let allViewedListings: ViewedListingType[] = [];

  if (viewedListingIds.length > 0) {
    const { data: listings } = await supabase
      .from("listings")
      .select(
        `
        id,
        title,
        price_monthly,
        beds,
        baths,
        is_uni_hub,
        listing_media(external_url, storage_path, order_index)
      `
      )
      .in("id", viewedListingIds)
      .eq("status", "active")
      .eq("moderation_status", "approved");

    // Maintain order from viewedListingIds
    const listingsMap = new Map(listings?.map((l) => [l.id, l]) || []);
    allViewedListings = viewedListingIds
      .map((id) => listingsMap.get(id))
      .filter((l): l is NonNullable<typeof l> => l != null);
  }

  // Split viewed listings by is_uni_hub (max 10 each)
  const viewedRentals = allViewedListings.filter((l) => !l.is_uni_hub).slice(0, 10);
  const viewedUniHub = allViewedListings.filter((l) => l.is_uni_hub).slice(0, 10);

  return (
    <SavedPageClient
      savedRentals={savedRentals}
      savedUniHub={savedUniHub}
      viewedRentals={viewedRentals}
      viewedUniHub={viewedUniHub}
    />
  );
}
