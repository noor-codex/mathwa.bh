"use client";

import { ChatThreadCard, SupportThreadCard } from "./chat-thread-card";
import type { ChatThreadWithDetails, SupportThread } from "@/lib/actions/chat";

type ChatThreadListProps = {
  threads: ChatThreadWithDetails[];
  supportThreads?: SupportThread[];
  isArchiveTab?: boolean;
  onArchive?: (threadId: string) => void;
  onUnarchive?: (threadId: string) => void;
  onPin?: (threadId: string, isPinned: boolean) => void;
  onDelete?: (threadId: string) => void;
};

export function ChatThreadList({
  threads,
  supportThreads = [],
  isArchiveTab = false,
  onArchive,
  onUnarchive,
  onPin,
  onDelete,
}: ChatThreadListProps) {
  // Combine support threads and chat threads for display
  const allItems = [
    ...threads.map((t) => ({ type: "chat" as const, thread: t })),
    ...supportThreads.map((t) => ({ type: "support" as const, thread: t })),
  ];

  // Sort by last_message_at (pinned items first for chat threads)
  allItems.sort((a, b) => {
    // Pinned chat threads come first
    if (a.type === "chat" && b.type === "chat") {
      if (a.thread.is_pinned && !b.thread.is_pinned) return -1;
      if (!a.thread.is_pinned && b.thread.is_pinned) return 1;
    }

    // Then sort by last_message_at
    const aTime = a.type === "chat" ? a.thread.last_message_at : a.thread.last_message_at;
    const bTime = b.type === "chat" ? b.thread.last_message_at : b.thread.last_message_at;

    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;

    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p
          className="text-center font-medium text-[#717182]"
          style={{ fontFamily: "Figtree", fontSize: 16 }}
        >
          {isArchiveTab ? "No archived chats" : "No chats yet"}
        </p>
        {!isArchiveTab && (
          <p
            className="mt-2 text-center font-normal text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 14 }}
          >
            Start a conversation from a listing page
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {allItems.map((item, index) => (
        <div key={item.type === "chat" ? item.thread.id : `support-${item.thread.id}`}>
          {item.type === "chat" ? (
            <ChatThreadCard
              thread={item.thread}
              isArchiveTab={isArchiveTab}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
              onPin={onPin}
              onDelete={onDelete}
            />
          ) : (
            <SupportThreadCard thread={item.thread} />
          )}

          {/* Separator - right aligned, 305px width */}
          {index < allItems.length - 1 && (
            <div className="flex justify-end px-0">
              <div
                style={{
                  width: 305,
                  height: 1,
                  border: "0.5px solid rgba(60, 60, 67, 0.3)",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
