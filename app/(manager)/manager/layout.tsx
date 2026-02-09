import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManagerLayoutClient } from "./manager-layout-client";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/manager/listings");
  }

  // Check if user has completed rental manager onboarding
  const { data: managerProfile } = await supabase
    .from("rental_manager_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!managerProfile) {
    redirect("/become-manager");
  }

  return <ManagerLayoutClient>{children}</ManagerLayoutClient>;
}
