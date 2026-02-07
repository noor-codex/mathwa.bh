"use server";

import { createClient } from "@/lib/supabase/server";

type SendChatMessageResult = {
  success: boolean;
  threadId?: string;
  error?: string;
};

type DeleteChatThreadResult = {
  success: boolean;
  error?: string;
};

// Types for chat thread with joined data
export type ChatThreadWithDetails = {
  id: string;
  listing_id: string;
  tenant_user_id: string;
  counterparty_type: "agent" | "landlord";
  agent_user_id: string | null;
  landlord_user_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  is_starred: boolean;
  is_muted: boolean;
  created_at: string;
  listing: {
    id: string;
    title: string;
    price_monthly: number | null;
    beds: number | null;
    baths: number | null;
    listing_media: Array<{
      external_url: string | null;
      storage_path: string | null;
      order_index: number;
    }>;
  } | null;
  counterparty: {
    user_id: string;
    display_name: string | null;
    email: string | null;
  } | null;
};

export type ChatMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  message_type: "text" | "system" | "structured_payload";
  body: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  sender: {
    user_id: string;
    display_name: string | null;
  } | null;
};

export type SupportThread = {
  id: string;
  user_id: string;
  subject: string | null;
  status: "open" | "resolved" | "closed";
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

type GetChatThreadsResult = {
  success: boolean;
  threads?: ChatThreadWithDetails[];
  error?: string;
};

type GetChatMessagesResult = {
  success: boolean;
  messages?: ChatMessage[];
  thread?: ChatThreadWithDetails;
  error?: string;
};

type UpdateThreadStatusResult = {
  success: boolean;
  error?: string;
};

type GetSupportThreadsResult = {
  success: boolean;
  threads?: SupportThread[];
  error?: string;
};

// Fetch all chat threads for the current user
export async function getChatThreads(
  filter: "all" | "archived" = "all"
): Promise<GetChatThreadsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Build query - use only columns that exist in the base schema
  // The is_archived/is_pinned/is_starred/is_muted columns are added by migration 20250204000001
  // If not yet applied, we query without them
  const query = supabase
    .from("chat_threads")
    .select(
      `
      id,
      listing_id,
      tenant_user_id,
      counterparty_type,
      agent_user_id,
      landlord_user_id,
      last_message_at,
      last_message_preview,
      created_at,
      listing:listings!chat_threads_listing_id_fkey (
        id,
        title,
        price_monthly,
        beds,
        baths,
        listing_media (
          external_url,
          storage_path,
          order_index
        )
      )
    `
    )
    .eq("tenant_user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const { data: threads, error: threadsError } = await query;

  if (threadsError) {
    console.error("Get threads error:", threadsError);
    return { success: false, error: "Failed to fetch threads" };
  }

  // Fetch counterparty profiles
  const counterpartyIds = threads
    .map((t) => t.agent_user_id || t.landlord_user_id)
    .filter((id): id is string => id !== null);

  let counterpartyMap: Record<string, { user_id: string; display_name: string | null; email: string | null }> = {};

  if (counterpartyIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", counterpartyIds);

    if (profiles) {
      counterpartyMap = Object.fromEntries(profiles.map((p) => [p.user_id, p]));
    }
  }

  // Map threads with counterparty info
  const threadsWithDetails: ChatThreadWithDetails[] = threads.map((thread) => {
    const counterpartyId = thread.agent_user_id || thread.landlord_user_id;
    // Supabase returns the relation as an array when using .select() with foreign keys
    // We need to handle both array and object cases
    const listingRaw = thread.listing;
    const listing = (Array.isArray(listingRaw) ? listingRaw[0] : listingRaw) as ChatThreadWithDetails["listing"] | undefined;
    
    // Sort listing_media by order_index
    if (listing?.listing_media) {
      listing.listing_media.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    }

    return {
      id: thread.id,
      listing_id: thread.listing_id,
      tenant_user_id: thread.tenant_user_id,
      counterparty_type: thread.counterparty_type as "agent" | "landlord",
      agent_user_id: thread.agent_user_id,
      landlord_user_id: thread.landlord_user_id,
      last_message_at: thread.last_message_at,
      last_message_preview: thread.last_message_preview,
      is_archived: (thread as Record<string, unknown>).is_archived as boolean ?? false,
      is_pinned: (thread as Record<string, unknown>).is_pinned as boolean ?? false,
      is_starred: (thread as Record<string, unknown>).is_starred as boolean ?? false,
      is_muted: (thread as Record<string, unknown>).is_muted as boolean ?? false,
      created_at: thread.created_at,
      listing: listing || null,
      counterparty: counterpartyId ? counterpartyMap[counterpartyId] || null : null,
    };
  });

  // Filter by archive status client-side (columns may not exist in DB yet)
  const filtered = filter === "archived"
    ? threadsWithDetails.filter((t) => t.is_archived)
    : threadsWithDetails.filter((t) => !t.is_archived);

  // Sort: pinned first
  filtered.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  return { success: true, threads: filtered };
}

// Fetch messages for a specific thread
export async function getChatMessages(
  threadId: string
): Promise<GetChatMessagesResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Fetch thread with listing details (only base schema columns)
  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select(
      `
      id,
      listing_id,
      tenant_user_id,
      counterparty_type,
      agent_user_id,
      landlord_user_id,
      last_message_at,
      last_message_preview,
      created_at,
      listing:listings!chat_threads_listing_id_fkey (
        id,
        title,
        price_monthly,
        beds,
        baths,
        listing_media (
          external_url,
          storage_path,
          order_index
        )
      )
    `
    )
    .eq("id", threadId)
    .single();

  if (threadError || !thread) {
    return { success: false, error: "Thread not found" };
  }

  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("id, thread_id, sender_user_id, message_type, body, payload, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Get messages error:", messagesError);
    return { success: false, error: "Failed to fetch messages" };
  }

  // Fetch sender profiles
  const senderIds = [...new Set(messages.map((m) => m.sender_user_id))];
  let senderMap: Record<string, { user_id: string; display_name: string | null }> = {};

  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", senderIds);

    if (profiles) {
      senderMap = Object.fromEntries(profiles.map((p) => [p.user_id, p]));
    }
  }

  // Fetch counterparty for thread
  const counterpartyId = thread.agent_user_id || thread.landlord_user_id;
  let counterparty: ChatThreadWithDetails["counterparty"] = null;

  if (counterpartyId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .eq("user_id", counterpartyId)
      .single();

    counterparty = profile || null;
  }

  const listingRaw = thread.listing;
  const listing = (Array.isArray(listingRaw) ? listingRaw[0] : listingRaw) as ChatThreadWithDetails["listing"] | undefined;
  if (listing?.listing_media) {
    listing.listing_media.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  const threadRec = thread as Record<string, unknown>;
  const threadWithDetails: ChatThreadWithDetails = {
    id: thread.id,
    listing_id: thread.listing_id,
    tenant_user_id: thread.tenant_user_id,
    counterparty_type: thread.counterparty_type as "agent" | "landlord",
    agent_user_id: thread.agent_user_id,
    landlord_user_id: thread.landlord_user_id,
    last_message_at: thread.last_message_at,
    last_message_preview: thread.last_message_preview,
    is_archived: threadRec.is_archived as boolean ?? false,
    is_pinned: threadRec.is_pinned as boolean ?? false,
    is_starred: threadRec.is_starred as boolean ?? false,
    is_muted: threadRec.is_muted as boolean ?? false,
    created_at: thread.created_at,
    listing: listing || null,
    counterparty,
  };

  const messagesWithSender: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    thread_id: msg.thread_id,
    sender_user_id: msg.sender_user_id,
    message_type: msg.message_type as ChatMessage["message_type"],
    body: msg.body,
    payload: msg.payload as Record<string, unknown> | null,
    created_at: msg.created_at,
    sender: senderMap[msg.sender_user_id] || null,
  }));

  return { success: true, messages: messagesWithSender, thread: threadWithDetails };
}

// Send message to existing thread
export async function sendMessageToThread(
  threadId: string,
  message: string
): Promise<SendChatMessageResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Insert the message
  const { error: messageError } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_user_id: user.id,
    message_type: "text",
    body: message,
  });

  if (messageError) {
    console.error("Message insert error:", messageError);
    return { success: false, error: "Failed to send message" };
  }

  // Update thread's last_message_at and preview
  const preview = message.length > 100 ? message.substring(0, 100) + "..." : message;
  await supabase
    .from("chat_threads")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
    })
    .eq("id", threadId);

  return { success: true, threadId };
}

// Update thread status flags
export async function updateThreadStatus(
  threadId: string,
  updates: {
    isArchived?: boolean;
    isPinned?: boolean;
    isStarred?: boolean;
    isMuted?: boolean;
  }
): Promise<UpdateThreadStatusResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  const updateData: Record<string, boolean> = {};
  if (updates.isArchived !== undefined) updateData.is_archived = updates.isArchived;
  if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;
  if (updates.isStarred !== undefined) updateData.is_starred = updates.isStarred;
  if (updates.isMuted !== undefined) updateData.is_muted = updates.isMuted;

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const { error: updateError } = await supabase
    .from("chat_threads")
    .update(updateData)
    .eq("id", threadId)
    .eq("tenant_user_id", user.id);

  if (updateError) {
    // If columns don't exist yet (migration not applied), silently succeed
    if (updateError.code === "42703") {
      console.warn("Thread status columns not yet available (migration pending)");
      return { success: true };
    }
    console.error("Update thread status error:", updateError);
    return { success: false, error: "Failed to update thread" };
  }

  return { success: true };
}

// Fetch support threads
export async function getSupportThreads(): Promise<GetSupportThreadsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  const { data: threads, error: threadsError } = await supabase
    .from("support_threads")
    .select("id, user_id, subject, status, last_message_at, last_message_preview, created_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (threadsError) {
    // If table doesn't exist yet (migration not applied), return empty array
    if (threadsError.code === "PGRST205" || threadsError.code === "42P01") {
      return { success: true, threads: [] };
    }
    console.error("Get support threads error:", threadsError);
    return { success: false, error: "Failed to fetch support threads" };
  }

  return {
    success: true,
    threads: threads as SupportThread[],
  };
}

export async function sendChatMessage(
  listingId: string,
  message: string
): Promise<SendChatMessageResult> {
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

  // Check if a thread already exists for this listing + tenant
  const { data: existingThread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("listing_id", listingId)
    .eq("tenant_user_id", user.id)
    .single();

  let threadId: string;

  if (existingThread) {
    threadId = existingThread.id;
  } else {
    // Create a new thread
    const { data: newThread, error: threadError } = await supabase
      .from("chat_threads")
      .insert({
        listing_id: listingId,
        tenant_user_id: user.id,
        counterparty_type: counterpartyType,
        agent_user_id: agentUserId,
        landlord_user_id: landlordUserId,
      })
      .select("id")
      .single();

    if (threadError || !newThread) {
      console.error("Thread creation error:", threadError);
      return { success: false, error: "Failed to create chat thread" };
    }

    threadId = newThread.id;
  }

  // Insert the message
  const { error: messageError } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_user_id: user.id,
    message_type: "text",
    body: message,
  });

  if (messageError) {
    console.error("Message insert error:", messageError);
    return { success: false, error: "Failed to send message" };
  }

  // Update thread's last_message_at and preview
  const preview = message.length > 100 ? message.substring(0, 100) + "..." : message;
  await supabase
    .from("chat_threads")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
    })
    .eq("id", threadId);

  return { success: true, threadId };
}

export async function deleteChatThread(
  threadId: string
): Promise<DeleteChatThreadResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Delete the thread (cascade will delete messages)
  // RLS ensures user can only delete threads they're a participant in
  const { error: deleteError } = await supabase
    .from("chat_threads")
    .delete()
    .eq("id", threadId)
    .eq("tenant_user_id", user.id);

  if (deleteError) {
    console.error("Thread deletion error:", deleteError);
    return { success: false, error: "Failed to delete chat thread" };
  }

  return { success: true };
}
