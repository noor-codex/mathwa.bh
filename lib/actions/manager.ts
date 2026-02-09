"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ---- Types ----

export type ManagerType = "private_owner" | "independent_agent" | "company_agent";
export type VerificationStatus = "pending" | "verified" | "rejected";

export type RentalManagerProfile = {
  user_id: string;
  manager_type: ManagerType;
  full_name: string;
  cpr_or_passport: string | null;
  phone: string | null;
  rera_cert_path: string | null;
  rera_verified: boolean;
  verification_doc_path: string | null;
  verification_status: VerificationStatus;
  agency_id: string | null;
  active_listing_count: number;
  max_free_listings: number;
  created_at: string;
  updated_at: string;
};

// ---- Onboarding ----

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const managerType = formData.get("manager_type") as ManagerType;
  const fullName = formData.get("full_name") as string;
  const cprOrPassport = formData.get("cpr_or_passport") as string | null;
  const phone = formData.get("phone") as string | null;
  const inviteCode = formData.get("invite_code") as string | null;

  if (!managerType || !fullName) {
    return { error: "Manager type and full name are required." };
  }

  // If company agent with invite code, look up the code
  let agencyId: string | null = null;
  let staffRole: string = "agent";

  if (managerType === "company_agent" && inviteCode) {
    const { data: codeData, error: codeError } = await supabase
      .from("company_invite_codes")
      .select("*")
      .eq("code", inviteCode)
      .single();

    if (codeError || !codeData) {
      return { error: "Invalid invite code." };
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return { error: "This invite code has expired." };
    }

    if (codeData.max_uses && codeData.uses_count >= codeData.max_uses) {
      return { error: "This invite code has reached its maximum uses." };
    }

    agencyId = codeData.agency_id;
    staffRole = codeData.role;

    // Increment uses count
    await supabase
      .from("company_invite_codes")
      .update({ uses_count: codeData.uses_count + 1 })
      .eq("id", codeData.id);
  }

  // Create rental manager profile
  const { error: profileError } = await supabase
    .from("rental_manager_profiles")
    .insert({
      user_id: user.id,
      manager_type: managerType,
      full_name: fullName,
      cpr_or_passport: cprOrPassport,
      phone: phone,
      agency_id: agencyId,
    });

  if (profileError) {
    console.error("completeOnboarding error:", profileError);
    return { error: profileError.message };
  }

  // If company agent, add to agency staff
  if (agencyId) {
    await supabase.from("agency_staff").insert({
      agency_id: agencyId,
      user_id: user.id,
      role: staffRole,
    });
  }

  // Update user profile to add rental_manager role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("user_id", user.id)
    .single();

  const currentRoles = (currentProfile?.roles as Record<string, boolean>) ?? {
    tenant: true,
  };
  const updatedRoles = { ...currentRoles, rental_manager: true };

  await supabase
    .from("profiles")
    .update({
      roles: updatedRoles,
      active_role: "rental_manager",
    })
    .eq("user_id", user.id);

  redirect("/manager/listings");
}

export async function getManagerProfile(): Promise<{
  success: boolean;
  profile?: RentalManagerProfile;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("rental_manager_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, profile: data as RentalManagerProfile };
}

// ---- Listings CRUD ----

export async function createListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check manager profile exists
  const { data: managerProfile } = await supabase
    .from("rental_manager_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!managerProfile) {
    return { error: "You must complete the Rental Manager onboarding first." };
  }

  const listingFor = formData.get("listing_for") as string;
  const agencyId =
    listingFor === "company" ? managerProfile.agency_id : null;

  // Check listing limits for non-company managers
  if (listingFor !== "company") {
    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("manager_user_id", user.id)
      .in("status", ["active", "pending_moderation"]);

    const activeCount = count ?? 0;
    if (activeCount >= managerProfile.max_free_listings) {
      return {
        error: `You have reached your free listing limit (${managerProfile.max_free_listings}). Upgrade to list more properties.`,
      };
    }
  }

  // Parse amenities
  const amenitiesRaw = formData.get("amenities") as string;
  const amenities = amenitiesRaw ? amenitiesRaw.split(",").filter(Boolean) : [];

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      manager_user_id: user.id,
      agency_id: agencyId,
      listing_for: listingFor || "own_property",
      status: "draft",
      property_type: formData.get("property_type") as string,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      price_monthly: formData.get("price_monthly")
        ? Number(formData.get("price_monthly"))
        : null,
      security_deposit: formData.get("security_deposit")
        ? Number(formData.get("security_deposit"))
        : null,
      beds: formData.get("beds") ? Number(formData.get("beds")) : null,
      baths: formData.get("baths") ? Number(formData.get("baths")) : null,
      area_sqm: formData.get("area_sqm")
        ? Number(formData.get("area_sqm"))
        : null,
      city: (formData.get("city") as string) || null,
      area: (formData.get("area") as string) || null,
      address: (formData.get("address") as string) || null,
      lat: formData.get("lat") ? Number(formData.get("lat")) : null,
      lng: formData.get("lng") ? Number(formData.get("lng")) : null,
      furnished_type: (formData.get("furnished_type") as string) || null,
      utilities_included: formData.get("utilities_included") === "true",
      ac_type: (formData.get("ac_type") as string) || null,
      pets_policy: (formData.get("pets_policy") as string) || null,
      amenities: amenities,
      move_in_special: formData.get("move_in_special") === "true",
      move_in_special_desc:
        (formData.get("move_in_special_desc") as string) || null,
      is_uni_hub: formData.get("is_uni_hub") === "true",
    })
    .select("id")
    .single();

  if (error) {
    console.error("createListing error:", error);
    return { error: error.message };
  }

  return { success: true, listingId: listing.id };
}

export async function updateListing(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const listingId = formData.get("listing_id") as string;
  if (!listingId) return { error: "Missing listing ID." };

  const amenitiesRaw = formData.get("amenities") as string;
  const amenities = amenitiesRaw ? amenitiesRaw.split(",").filter(Boolean) : [];

  const updates: Record<string, unknown> = {};
  const fields = [
    "property_type",
    "title",
    "description",
    "city",
    "area",
    "address",
    "furnished_type",
    "ac_type",
    "pets_policy",
    "listing_for",
    "move_in_special_desc",
    "verification_doc_path",
  ];

  for (const f of fields) {
    const val = formData.get(f);
    if (val !== null) updates[f] = val;
  }

  const numericFields = [
    "price_monthly",
    "security_deposit",
    "beds",
    "baths",
    "area_sqm",
    "lat",
    "lng",
  ];
  for (const f of numericFields) {
    const val = formData.get(f);
    if (val !== null && val !== "") updates[f] = Number(val);
  }

  const boolFields = ["utilities_included", "move_in_special", "is_uni_hub"];
  for (const f of boolFields) {
    const val = formData.get(f);
    if (val !== null) updates[f] = val === "true";
  }

  updates.amenities = amenities;

  const { error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", listingId)
    .eq("manager_user_id", user.id);

  if (error) {
    console.error("updateListing error:", error);
    return { error: error.message };
  }

  revalidatePath("/manager/listings");
  return { success: true };
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "removed" })
    .eq("id", listingId)
    .eq("manager_user_id", user.id);

  if (error) {
    console.error("deleteListing error:", error);
    return { error: error.message };
  }

  revalidatePath("/manager/listings");
  return { success: true };
}

export async function publishListing(listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check verification status
  const { data: managerProfile } = await supabase
    .from("rental_manager_profiles")
    .select("verification_status, manager_type, rera_verified")
    .eq("user_id", user.id)
    .single();

  // Determine listing status based on verification
  let newStatus: "active" | "pending_moderation" = "pending_moderation";
  if (
    managerProfile?.verification_status === "verified" &&
    (managerProfile.manager_type === "private_owner" ||
      managerProfile.rera_verified)
  ) {
    newStatus = "active";
  }

  const { error } = await supabase
    .from("listings")
    .update({
      status: newStatus,
      moderation_status: newStatus === "active" ? "approved" : "pending",
      publish_at: new Date().toISOString(),
      renew_by: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", listingId)
    .eq("manager_user_id", user.id);

  if (error) {
    console.error("publishListing error:", error);
    return { error: error.message };
  }

  revalidatePath("/manager/listings");
  return { success: true, status: newStatus };
}

// ---- Invite Code Redemption ----

export async function redeemInviteCode(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: codeData, error: codeError } = await supabase
    .from("company_invite_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (codeError || !codeData) {
    return { error: "Invalid invite code." };
  }

  if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
    return { error: "This invite code has expired." };
  }

  if (codeData.max_uses && codeData.uses_count >= codeData.max_uses) {
    return { error: "This invite code has reached its maximum uses." };
  }

  // Link to company
  const { error: updateError } = await supabase
    .from("rental_manager_profiles")
    .update({
      agency_id: codeData.agency_id,
      manager_type: "company_agent",
    })
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Add to agency staff
  await supabase.from("agency_staff").insert({
    agency_id: codeData.agency_id,
    user_id: user.id,
    role: codeData.role,
  });

  // Increment uses count
  await supabase
    .from("company_invite_codes")
    .update({ uses_count: codeData.uses_count + 1 })
    .eq("id", codeData.id);

  return { success: true, agencyId: codeData.agency_id };
}

// ---- Tour Management ----

export async function updateTourRequest(
  tourId: string,
  action: "accepted" | "denied" | "rescheduled",
  rescheduledSlot?: string,
  rescheduleReason?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const updates: Record<string, unknown> = { status: action };
  if (action === "rescheduled" && rescheduledSlot) {
    updates.rescheduled_slot = rescheduledSlot;
    updates.reschedule_reason = rescheduleReason || null;
  }

  const { error } = await supabase
    .from("tour_requests")
    .update(updates)
    .eq("id", tourId)
    .eq("manager_user_id", user.id);

  if (error) {
    console.error("updateTourRequest error:", error);
    return { error: error.message };
  }

  revalidatePath("/manager/tours");
  return { success: true };
}
