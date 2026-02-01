"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function toggleSave(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  if (!listingId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/discover");
  }

  const { data: existing } = await supabase
    .from("saved_listings")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    await supabase
      .from("saved_listings")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
  } else {
    await supabase.from("saved_listings").insert({
      user_id: user.id,
      listing_id: listingId,
    });
  }
}
