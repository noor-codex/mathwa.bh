import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { DiscoverTabs } from "./discover-tabs";

export const dynamic = "force-dynamic";

type SearchParams = { feed?: string; sort?: string };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = (await searchParams) as SearchParams;
  const feed = params.feed === "uni-hub" ? "uni-hub" : "rentals";
  const sort = params.sort || "newest";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("listings")
    .select("id, title, price_monthly, beds, baths, city, is_featured, is_uni_hub, created_at")
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .in("is_uni_hub", feed === "uni-hub" ? [true] : [false]);


  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "price_asc") {
    query = query.order("price_monthly", { ascending: true, nullsFirst: false });
  } else if (sort === "price_desc") {
    query = query.order("price_monthly", { ascending: false, nullsFirst: false });
  }

  const { data: listings, error } = await query;

  if (error) {
    const errMsg =
      (error as { message?: string })?.message ??
      (error as { code?: string })?.code ??
      (error instanceof Error ? error.toString() : String(error));
    console.error("[Discover] Supabase error:", errMsg);
  } else {
    console.log("[Discover] Listings count:", listings?.length ?? 0, "feed:", feed);
  }

  const savedIds = new Set<string>();
  if (user) {
    const { data: saved } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id);
    saved?.forEach((s) => savedIds.add(s.listing_id));
  }

  const listingsWithSaved = (listings || []).map((l) => ({
    ...l,
    saved: savedIds.has(l.id),
  }));

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Discover</h1>
          <DiscoverTabs feed={feed} sort={sort} />
        </div>
      </div>

      <div className="grid gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {error ? (
          <p className="col-span-full py-8 text-center text-destructive">
            Error: {(error as { message?: string })?.message ?? (error as { code?: string })?.code ?? String(error)}
          </p>
        ) : listingsWithSaved.length === 0 ? (
          <p className="col-span-full py-8 text-center text-muted-foreground">
            No listings yet. Run the seed migration to add sample data.
          </p>
        ) : (
          listingsWithSaved.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        )}
      </div>
    </div>
  );
}
