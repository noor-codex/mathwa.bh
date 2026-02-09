import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ManagerListingCard } from "@/components/manager/manager-listing-card";

export const dynamic = "force-dynamic";

export default async function ManagerListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      "id, title, status, moderation_status, price_monthly, beds, baths, city, area, property_type, is_premium, listing_media(external_url, storage_path)"
    )
    .eq("manager_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ManagerListingsPage error:", error);
  }

  const allListings = listings ?? [];
  const active = allListings.filter(
    (l) => l.status === "active" && l.moderation_status === "approved"
  );
  const pending = allListings.filter(
    (l) => l.status === "draft" || l.status === "pending_moderation"
  );
  const removed = allListings.filter((l) => l.status === "removed");

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">My Listings</h1>
        <Link href="/manager/listings/create">
          <Button size="sm">+ Create Listing</Button>
        </Link>
      </div>

      {/* Active */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Active ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active listings yet.
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((listing) => (
              <ManagerListingCard
                key={listing.id}
                listing={listing as any}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pending */}
      {pending.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((listing) => (
              <ManagerListingCard
                key={listing.id}
                listing={listing as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* Removed / Archived */}
      {removed.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Removed ({removed.length})
          </h2>
          <div className="space-y-3">
            {removed.map((listing) => (
              <ManagerListingCard
                key={listing.id}
                listing={listing as any}
              />
            ))}
          </div>
        </section>
      )}

      {allListings.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t created any listings yet.
          </p>
          <Link href="/manager/listings/create">
            <Button>Create your first listing</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
