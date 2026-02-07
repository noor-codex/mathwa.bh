import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChatMessages } from "@/lib/actions/chat";
import { ChatView } from "./chat-view";

type ChatThreadPageProps = {
  params: Promise<{ threadId: string }>;
};

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const { threadId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch thread and messages
  const result = await getChatMessages(threadId);

  if (!result.success || !result.thread) {
    notFound();
  }

  return (
    <ChatView
      thread={result.thread}
      initialMessages={result.messages || []}
      currentUserId={user.id}
    />
  );
}
