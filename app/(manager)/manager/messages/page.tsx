import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ManagerMessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: threads, error } = await supabase
    .from("chat_threads")
    .select(
      "id, listing_id, last_message_at, last_message_preview, is_archived, listing:listings(title, city, area), tenant:profiles!chat_threads_tenant_user_id_fkey(display_name, email)"
    )
    .eq("manager_user_id", user.id)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false });

  if (error) {
    console.error("ManagerMessagesPage error:", error);
  }

  const allThreads = (threads ?? []).map((t: any) => ({
    ...t,
    listing: t.listing ?? { title: "Unknown", city: null, area: null },
    tenant: t.tenant ?? { display_name: null, email: null },
  }));

  // Group threads by listing
  const groupedByListing: Record<
    string,
    { listingTitle: string; threads: typeof allThreads }
  > = {};

  for (const thread of allThreads) {
    const key = thread.listing_id;
    if (!groupedByListing[key]) {
      groupedByListing[key] = {
        listingTitle: thread.listing?.title ?? "Unknown Listing",
        threads: [],
      };
    }
    groupedByListing[key].threads.push(thread);
  }

  const groups = Object.entries(groupedByListing);

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-semibold mb-6">Messages</h1>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No messages yet. Conversations will appear here when tenants message
            you about your listings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([listingId, group]) => (
            <section key={listingId}>
              <h2 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                {group.listingTitle}
              </h2>
              <div className="space-y-2">
                {group.threads.map((thread: any) => {
                  const tenantName =
                    thread.tenant?.display_name ??
                    thread.tenant?.email ??
                    "Unknown Tenant";
                  const lastMsg = thread.last_message_preview ?? "No messages yet";
                  const lastTime = thread.last_message_at
                    ? new Date(thread.last_message_at).toLocaleDateString(
                        "en-BH",
                        { month: "short", day: "numeric" }
                      )
                    : "";

                  return (
                    <Link
                      key={thread.id}
                      href={`/manager/messages/${thread.id}`}
                      className="flex items-center justify-between rounded-xl border p-3 transition hover:bg-muted/50"
                    >
                      <div className="overflow-hidden">
                        <div className="font-medium text-sm truncate">
                          {tenantName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lastMsg}
                        </div>
                      </div>
                      <span className="ml-3 flex-shrink-0 text-xs text-muted-foreground">
                        {lastTime}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
