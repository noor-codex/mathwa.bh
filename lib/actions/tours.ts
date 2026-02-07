"use server";

import { createClient } from "@/lib/supabase/server";

type CreateTourRequestResult = {
  success: boolean;
  tourId?: string;
  error?: string;
};

type CancelTourRequestResult = {
  success: boolean;
  error?: string;
};

export async function createTourRequest(
  listingId: string,
  requestedSlot: Date
): Promise<CreateTourRequestResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Get listing details to determine counterparty
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, owner_type, landlord_user_id, agent_user_id")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return { success: false, error: "Listing not found" };
  }

  // Determine counterparty type and ID based on listing owner
  const counterpartyType = listing.owner_type === "agency" ? "agent" : "landlord";
  const agentUserId = counterpartyType === "agent" ? listing.agent_user_id : null;
  const landlordUserId = counterpartyType === "landlord" ? listing.landlord_user_id : null;

  // Create the tour request
  const { data: tourRequest, error: createError } = await supabase
    .from("tour_requests")
    .insert({
      listing_id: listingId,
      tenant_user_id: user.id,
      counterparty_type: counterpartyType,
      agent_user_id: agentUserId,
      landlord_user_id: landlordUserId,
      requested_slot: requestedSlot.toISOString(),
      status: "pending",
    })
    .select("id")
    .single();

  if (createError) {
    console.error("Tour request creation error:", createError);
    return { success: false, error: "Failed to create tour request" };
  }

  return { success: true, tourId: tourRequest.id };
}

export async function cancelTourRequest(
  tourId: string
): Promise<CancelTourRequestResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Verify the tour belongs to this user and update status
  const { error: updateError } = await supabase
    .from("tour_requests")
    .update({ status: "cancelled" })
    .eq("id", tourId)
    .eq("tenant_user_id", user.id);

  if (updateError) {
    console.error("Tour cancellation error:", updateError);
    return { success: false, error: "Failed to cancel tour request" };
  }

  return { success: true };
}
