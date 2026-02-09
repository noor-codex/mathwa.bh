import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BecomeManagerForm } from "./become-manager-form";

export default async function BecomeManagerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/become-manager");
  }

  // Check if already a rental manager
  const { data: managerProfile } = await supabase
    .from("rental_manager_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (managerProfile) {
    redirect("/manager/listings");
  }

  // Get existing profile data to pre-fill
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, phone")
    .eq("user_id", user.id)
    .single();

  return (
    <BecomeManagerForm
      prefill={{
        fullName: profile?.display_name ?? "",
        email: profile?.email ?? user.email ?? "",
        phone: profile?.phone ?? "",
      }}
    />
  );
}
