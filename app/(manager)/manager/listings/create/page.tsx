import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateListingForm } from "./create-listing-form";

export default async function CreateListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager/listings/create");
  }

  const { data: managerProfile } = await supabase
    .from("rental_manager_profiles")
    .select("manager_type, agency_id, verification_status, max_free_listings, active_listing_count")
    .eq("user_id", user.id)
    .single();

  if (!managerProfile) {
    redirect("/become-manager");
  }

  return (
    <CreateListingForm
      managerType={managerProfile.manager_type}
      agencyId={managerProfile.agency_id}
      isVerified={managerProfile.verification_status === "verified"}
    />
  );
}
