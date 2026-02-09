import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ManagerProfileActions } from "./manager-profile-actions";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  private_owner: "Private Owner",
  independent_agent: "Independent Agent",
  company_agent: "Company Agent",
};

const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pending Verification",
  verified: "Verified",
  rejected: "Verification Rejected",
};

export default async function ManagerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, avatar_url")
    .eq("user_id", user.id)
    .single();

  const { data: managerProfile } = await supabase
    .from("rental_manager_profiles")
    .select("manager_type, full_name, verification_status, agency_id, rera_verified, active_listing_count, max_free_listings")
    .eq("user_id", user.id)
    .single();

  let companyName: string | null = null;
  if (managerProfile?.agency_id) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("name")
      .eq("id", managerProfile.agency_id)
      .single();
    companyName = agency?.name ?? null;
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-semibold mb-6">Manager Profile</h1>

      {/* Profile card */}
      <div className="rounded-xl border p-4 space-y-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
            {(managerProfile?.full_name ?? profile?.display_name ?? "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">
              {managerProfile?.full_name ?? profile?.display_name ?? "Unknown"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile?.email ?? user.email}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profile Type</span>
            <span className="font-medium">
              {TYPE_LABELS[managerProfile?.manager_type ?? ""] ??
                managerProfile?.manager_type}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Verification</span>
            <span className="font-medium">
              {VERIFICATION_LABELS[
                managerProfile?.verification_status ?? "pending"
              ] ?? managerProfile?.verification_status}
            </span>
          </div>
          {managerProfile?.manager_type !== "company_agent" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free Listings</span>
              <span className="font-medium">
                {managerProfile?.active_listing_count ?? 0} /{" "}
                {managerProfile?.max_free_listings ?? 1}
              </span>
            </div>
          )}
          {companyName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-medium">{companyName}</span>
            </div>
          )}
          {managerProfile?.manager_type !== "private_owner" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">RERA Verified</span>
              <span className="font-medium">
                {managerProfile?.rera_verified ? "Yes" : "No"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link href="/discover">
          <Button variant="outline" className="w-full">
            Switch to Tenant View
          </Button>
        </Link>

        <ManagerProfileActions />
      </div>
    </div>
  );
}
