import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function parseList(param: string | undefined): string[] {
  if (!param?.trim()) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * GET /api/discover/count
 * Returns the number of listings matching the same filters as the discover page.
 * Query params: feed, area, price_min, price_max, beds, baths
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feed = searchParams.get("feed") === "uni-hub" ? "uni-hub" : "rentals";
  const areas = parseList(searchParams.get("area") ?? undefined);
  const priceMin = searchParams.get("price_min")?.trim();
  const priceMax = searchParams.get("price_max")?.trim();
  const bedsParam = searchParams.get("beds")?.trim();
  const bathsParam = searchParams.get("baths")?.trim();
  const bedsOnly = searchParams.get("beds_only") === "true";
  const bathsOnly = searchParams.get("baths_only") === "true";

  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("moderation_status", "approved")
    .in("is_uni_hub", feed === "uni-hub" ? [true] : [false]);

  if (areas.length > 0) {
    query = query.in("area", areas);
  }

  if (priceMin) {
    const n = parseInt(priceMin, 10);
    if (!Number.isNaN(n)) query = query.gte("price_monthly", n);
  }
  if (priceMax) {
    const n = parseInt(priceMax, 10);
    if (!Number.isNaN(n)) query = query.lte("price_monthly", n);
  }

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

  if (bathsParam !== undefined && bathsParam !== "") {
    const n = parseFloat(bathsParam);
    if (!Number.isNaN(n)) {
      query = bathsOnly ? query.eq("baths", n) : query.gte("baths", n);
    }
  }

  const { count, error } = await query;

  if (error) {
    console.error("[Discover count API]", error);
    return NextResponse.json(
      { error: (error as { message?: string }).message ?? "Failed to get count" },
      { status: 500 }
    );
  }

  return NextResponse.json({ count: count ?? 0 });
}
