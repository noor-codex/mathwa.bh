import { createClient } from "@/lib/supabase/server";
import { TourCard } from "@/components/manager/tour-card";

export const dynamic = "force-dynamic";

export default async function ManagerToursPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const { data: tours, error } = await supabase
    .from("tour_requests")
    .select(
      "id, listing_id, requested_slot, status, rescheduled_slot, reschedule_reason, listing:listings(title, city, area), tenant:profiles!tour_requests_tenant_user_id_fkey(display_name, email)"
    )
    .eq("manager_user_id", user.id)
    .order("requested_slot", { ascending: true });

  if (error) {
    console.error("ManagerToursPage error:", error);
  }

  const allTours = (tours ?? []).map((t: any) => ({
    ...t,
    listing: t.listing ?? { title: "Unknown", city: null, area: null },
    tenant: t.tenant ?? { display_name: null, email: null },
  }));

  const today = allTours.filter((t: any) => {
    const slot = new Date(t.requested_slot);
    return slot >= startOfToday && slot < endOfToday;
  });

  const upcoming = allTours.filter((t: any) => {
    const slot = new Date(t.requested_slot);
    return slot >= endOfToday;
  });

  const past = allTours.filter((t: any) => {
    const slot = new Date(t.requested_slot);
    return slot < startOfToday;
  });

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-semibold mb-6">Tours</h1>

      {/* Today */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Today ({today.length})
        </h2>
        {today.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tours scheduled for today.
          </p>
        ) : (
          <div className="space-y-3">
            {today.map((tour: any) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming tours.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((tour: any) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Past ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((tour: any) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>
      )}

      {allTours.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No tour requests yet. They&apos;ll appear here when tenants book
            tours on your listings.
          </p>
        </div>
      )}
    </div>
  );
}
