import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PersonalInfoClient } from "./personal-info-client";

export default async function PersonalInformationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <PersonalInfoClient
      displayName={profile?.display_name ?? ""}
      phone={profile?.phone ?? ""}
      email={profile?.email ?? user.email ?? ""}
      identityVerified={profile?.identity_verified ?? false}
    />
  );
}
