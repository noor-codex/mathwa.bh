"use client";

import { useState, useCallback, useOptimistic, useTransition } from "react";
import { ChatThreadList } from "@/components/messages/chat-thread-list";
import { updateThreadStatus } from "@/lib/actions/chat";
import type { ChatThreadWithDetails, SupportThread } from "@/lib/actions/chat";
import { cn } from "@/lib/utils";

type MessagesClientProps = {
  initialThreads: ChatThreadWithDetails[];
  archivedThreads: ChatThreadWithDetails[];
  supportThreads: SupportThread[];
};

export function MessagesClient({
  initialThreads,
  archivedThreads,
  supportThreads,
}: MessagesClientProps) {
  const [activeTab, setActiveTab] = useState<"archived" | "my_chats">("my_chats");
  const [isPending, startTransition] = useTransition();

  // Optimistic updates for threads
  const [optimisticThreads, setOptimisticThreads] = useOptimistic(
    initialThreads,
    (state, update: { threadId: string; action: "archive" | "unarchive" | "pin" | "unpin" }) => {
      return state.filter((t) => {
        if (t.id === update.threadId) {
          if (update.action === "archive") return false; // Remove from active list
          return true;
        }
        return true;
      }).map((t) => {
        if (t.id === update.threadId) {
          if (update.action === "pin") return { ...t, is_pinned: true };
          if (update.action === "unpin") return { ...t, is_pinned: false };
        }
        return t;
      });
    }
  );

  const [optimisticArchived, setOptimisticArchived] = useOptimistic(
    archivedThreads,
    (state, update: { threadId: string; action: "unarchive" }) => {
      if (update.action === "unarchive") {
        return state.filter((t) => t.id !== update.threadId);
      }
      return state;
    }
  );

  const handleArchive = useCallback(
    (threadId: string) => {
      startTransition(async () => {
        setOptimisticThreads({ threadId, action: "archive" });
        await updateThreadStatus(threadId, { isArchived: true });
      });
    },
    [setOptimisticThreads]
  );

  const handleUnarchive = useCallback(
    (threadId: string) => {
      startTransition(async () => {
        setOptimisticArchived({ threadId, action: "unarchive" });
        await updateThreadStatus(threadId, { isArchived: false });
      });
    },
    [setOptimisticArchived]
  );

  const handlePin = useCallback(
    (threadId: string, isPinned: boolean) => {
      startTransition(async () => {
        setOptimisticThreads({ threadId, action: isPinned ? "pin" : "unpin" });
        await updateThreadStatus(threadId, { isPinned });
      });
    },
    [setOptimisticThreads]
  );

  const handleDelete = useCallback((threadId: string) => {
    // TODO: Implement delete with confirmation dialog
    console.log("Delete thread:", threadId);
  }, []);

  const isMyChatsTab = activeTab === "my_chats";

  return (
    <div className="flex flex-col bg-white pb-20">
      {/* Tab navigation */}
      <div className="flex h-[60px] items-center justify-center">
        <div className="flex items-center justify-center gap-[30px]">
          {/* Archived tab */}
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className="flex flex-col items-center gap-[5px]"
          >
            <span
              className={cn(
                "text-center",
                activeTab === "archived"
                  ? "font-semibold text-[#111111]"
                  : "font-medium text-[#374151]"
              )}
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Archived
            </span>
            <div
              className="h-[3px] w-[29px] rounded-full"
              style={{
                backgroundColor: activeTab === "archived" ? "#111111" : "transparent",
              }}
            />
          </button>

          {/* My Chats tab */}
          <button
            type="button"
            onClick={() => setActiveTab("my_chats")}
            className="flex flex-col items-center gap-[5px]"
          >
            <span
              className={cn(
                "text-center",
                activeTab === "my_chats"
                  ? "font-semibold text-[#111111]"
                  : "font-medium text-[#374151]"
              )}
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              My Chats
            </span>
            <div
              className="h-[3px] w-[29px] rounded-full"
              style={{
                backgroundColor: activeTab === "my_chats" ? "#111111" : "transparent",
              }}
            />
          </button>
        </div>
      </div>

      {/* Header with title and sort */}
      <div className="flex items-center justify-between px-5 py-2">
        <h2
          className="font-semibold text-[#1A1A1A]"
          style={{
            fontFamily: "Figtree",
            fontSize: 25,
            lineHeight: "28px",
            letterSpacing: "-0.44px",
          }}
        >
          {isMyChatsTab ? "My chats" : "Archived"}
        </h2>
        <button
          type="button"
          className="font-normal text-[#1A1A1A]"
          style={{
            fontFamily: "Figtree",
            fontSize: 15,
            lineHeight: "28px",
            letterSpacing: "-0.44px",
          }}
        >
          Sort by
        </button>
      </div>

      {/* Thread list */}
      <div className={cn("px-0", isPending && "opacity-70")}>
        {isMyChatsTab ? (
          <ChatThreadList
            threads={optimisticThreads}
            supportThreads={supportThreads}
            isArchiveTab={false}
            onArchive={handleArchive}
            onPin={handlePin}
          />
        ) : (
          <ChatThreadList
            threads={optimisticArchived}
            isArchiveTab={true}
            onUnarchive={handleUnarchive}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
