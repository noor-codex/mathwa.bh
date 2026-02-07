import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChatThreads, getSupportThreads } from "@/lib/actions/chat";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch threads in parallel
  const [activeResult, archivedResult, supportResult] = await Promise.all([
    getChatThreads("all"),
    getChatThreads("archived"),
    getSupportThreads(),
  ]);

  const initialThreads = activeResult.success ? activeResult.threads || [] : [];
  const archivedThreads = archivedResult.success ? archivedResult.threads || [] : [];
  const supportThreads = supportResult.success ? supportResult.threads || [] : [];

  return (
    <MessagesClient
      initialThreads={initialThreads}
      archivedThreads={archivedThreads}
      supportThreads={supportThreads}
    />
  );
}
