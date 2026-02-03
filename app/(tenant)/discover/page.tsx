import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/listing-card";
import { DiscoverHeader } from "@/components/layout/discover-header";
import {
  buildDiscoverTitle,
  buildFilterPills,
  type DiscoverSearchParams,
  type FilterPillItem,
} from "@/lib/discover-filters";
import { DiscoverSortBy } from "./discover-sort-by";

export const dynamic = "force-dynamic";

function parseList(param: string | undefined): string[] {
  if (!param?.trim()) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<DiscoverSearchParams>;
}) {
  const params = (await searchParams) as DiscoverSearchParams;
  const feed = params.feed === "uni-hub" ? "uni-hub" : "rentals";
  const tab = params.tab ?? "current-search";
  const sortParam = params.sort || "newest";
  const sort =
    tab === "newest" ? "newest" : tab === "popular" ? "price_desc" : sortParam;
  const dynamicTitle = buildDiscoverTitle(params);
  const filterPills = buildFilterPills(params);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Omit furnished_type and utilities_included when DB has not run migrations 20250201000010 / 20250201000011
  const selectColumns =
    "id, title, price_monthly, beds, baths, city, area, area_sqm, owner_type, is_featured, is_uni_hub, created_at, listing_media(external_url, storage_path, order_index)";

  let query = supabase
    .from("listings")
    .select(selectColumns)
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .in("is_uni_hub", feed === "uni-hub" ? [true] : [false]);

  const areas = parseList(params.area);
  if (areas.length > 0) {
    query = query.in("area", areas);
  }

  const priceMin = params.price_min?.trim();
  const priceMax = params.price_max?.trim();
  if (priceMin) {
    const n = parseInt(priceMin, 10);
    if (!Number.isNaN(n)) query = query.gte("price_monthly", n);
  }
  if (priceMax) {
    const n = parseInt(priceMax, 10);
    if (!Number.isNaN(n)) query = query.lte("price_monthly", n);
  }

  const bedsParam = params.beds?.trim();
  const bedsOnly = params.beds_only === "true";
  if (bedsParam !== undefined && bedsParam !== "") {
    const lower = bedsParam.toLowerCase();
    if (lower === "studio" || lower === "0") {
      query = query.eq("beds", 0);
    } else {
      const n = parseInt(bedsParam, 10);
      if (!Number.isNaN(n)) {
        query = bedsOnly ? query.eq("beds", n) : query.gte("beds", n);
      }
    }
  }

  const bathsParam = params.baths?.trim();
  const bathsOnly = params.baths_only === "true";
  if (bathsParam !== undefined && bathsParam !== "") {
    const n = parseFloat(bathsParam);
    if (!Number.isNaN(n)) {
      query = bathsOnly ? query.eq("baths", n) : query.gte("baths", n);
    }
  }

  // EWA filter omitted until utilities_included exists (run migrations 20250201000010 + 20250201000011 to enable)

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "price_asc") {
    query = query.order("price_monthly", { ascending: true, nullsFirst: false });
  } else if (sort === "price_desc") {
    query = query.order("price_monthly", { ascending: false, nullsFirst: false });
  } else if (sort === "featured_first") {
    query = query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  } else if (sort === "area_sqm_first") {
    query = query.order("area_sqm", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
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
      <DiscoverHeader feed={feed} />
      <div className="mx-auto max-w-xl px-4 py-3 sm:max-w-2xl lg:max-w-4xl">
        <div className="mt-4 flex flex-row items-center justify-between gap-3">
          <h1
            className="min-w-0 flex-1 truncate text-[25px] font-semibold leading-7 tracking-[-0.44px] text-[#1A1A1A]"
            style={{ fontFamily: "var(--font-sans), 'Figtree', sans-serif" }}
          >
            {dynamicTitle}
          </h1>
          <Suspense fallback={<span className="shrink-0 text-sm text-[var(--discover-grey)]">Sort by</span>}>
            <div className="shrink-0">
              <DiscoverSortBy feed={feed} sort={sort} />
            </div>
          </Suspense>
        </div>
        {filterPills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {filterPills.map((pill) => {
              const label =
                pill.id === "extra" ? `+${(pill as { count: number }).count}` : (pill as { label: string }).label;
              return (
                <span
                  key={pill.id === "extra" ? "extra" : pill.id}
                  className="box-border flex min-h-7 flex-row items-center justify-center gap-2 rounded-[10px] border border-[#374151] bg-[#F3F4F6] px-2.5 py-1.5 text-sm text-[#374151]"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-xl gap-3 px-4 pt-4 sm:max-w-2xl sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-3">
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
