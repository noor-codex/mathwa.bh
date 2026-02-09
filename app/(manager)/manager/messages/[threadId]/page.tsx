import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ManagerChatThread } from "./manager-chat-thread";

export const dynamic = "force-dynamic";

export default async function ManagerChatPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch thread with listing and tenant info
  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select(
      "id, listing_id, tenant_user_id, manager_user_id, is_archived, listing:listings(title), tenant:profiles!chat_threads_tenant_user_id_fkey(display_name, email)"
    )
    .eq("id", threadId)
    .eq("manager_user_id", user.id)
    .single();

  if (threadError || !thread) {
    redirect("/manager/messages");
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, sender_user_id, message_type, body, payload, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return (
    <ManagerChatThread
      thread={{
        id: thread.id,
        listingTitle: (thread as any).listing?.title ?? "Unknown Listing",
        tenantName:
          (thread as any).tenant?.display_name ??
          (thread as any).tenant?.email ??
          "Unknown Tenant",
        isArchived: thread.is_archived,
      }}
      messages={(messages ?? []).map((m) => ({
        id: m.id,
        senderUserId: m.sender_user_id,
        messageType: m.message_type,
        body: m.body,
        payload: m.payload,
        createdAt: m.created_at,
      }))}
      currentUserId={user.id}
      threadId={threadId}
    />
  );
}
