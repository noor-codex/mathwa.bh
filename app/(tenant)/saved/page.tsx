import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/saved");
  }

  const { data: savedRows } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id);

  if (!savedRows?.length) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold">Saved</h1>
        <p className="mt-2 text-center text-muted-foreground">
          No saved listings yet. Browse Discover and tap the bookmark to save.
        </p>
        <Button asChild className="mt-4">
          <Link href="/discover">Discover</Link>
        </Button>
      </div>
    );
  }

  const listingIds = savedRows.map((r) => r.listing_id);

  const { data: listings } = await supabase
    .from("listings")
    .select(
      `
      id,
      title,
      price_monthly,
      beds,
      baths,
      city,
      is_featured,
      is_uni_hub,
      listing_media(external_url, storage_path)
    `
    )
    .in("id", listingIds)
    .eq("status", "active")
    .eq("moderation_status", "approved");

  const listingsWithSaved = (listings || []).map((l) => ({
    ...l,
    saved: true,
  }));

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold">Saved</h1>
      <p className="mt-1 text-muted-foreground text-sm">
        {listingsWithSaved.length} listing{listingsWithSaved.length !== 1 ? "s" : ""}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listingsWithSaved.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
