"use client";

import type { ChatMessage } from "@/lib/actions/chat";

type MessageBubbleProps = {
  message: ChatMessage;
  isSent: boolean;
  showTimestamp?: boolean;
};

// Format time as HH:MM
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

export function MessageBubble({
  message,
  isSent,
  showTimestamp = true,
}: MessageBubbleProps) {
  // Handle text messages
  if (message.message_type === "text" && message.body) {
    return (
      <div
        className={`flex ${isSent ? "justify-end" : "justify-start"} mb-2`}
      >
        <div
          className="relative max-w-[271px]"
          style={{
            filter: isSent
              ? "drop-shadow(0.5px 0.5px 0.8px rgba(0, 0, 0, 0.4))"
              : "none",
          }}
        >
          {/* Message bubble */}
          <div
            className="rounded-lg px-4 py-2"
            style={{
              backgroundColor: isSent ? "#1A1A1A" : "#F3F4F6",
              borderRadius: 8,
            }}
          >
            {/* Message text */}
            <p
              className="font-medium"
              style={{
                fontFamily: "Figtree",
                fontSize: 20,
                lineHeight: "24px",
                color: isSent ? "#FFFFFF" : "#374151",
              }}
            >
              {message.body}
            </p>

            {/* Timestamp and read receipt */}
            {showTimestamp && (
              <div
                className={`mt-1 flex items-center gap-1 ${
                  isSent ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className="font-normal"
                  style={{
                    fontFamily: "Figtree",
                    fontSize: isSent ? 13 : 12,
                    lineHeight: isSent ? "16px" : "14px",
                    color: isSent ? "#FFFFFF" : "rgba(0, 0, 0, 0.25)",
                    letterSpacing: isSent ? undefined : "0.5px",
                    textAlign: isSent ? "right" : "left",
                  }}
                >
                  {formatTime(message.created_at)}
                </span>

                {/* Read receipt (for sent messages) */}
                {isSent && (
                  <svg
                    width="14"
                    height="11"
                    viewBox="0 0 14 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 5.5L4.5 9L13 1"
                      stroke="#3497F9"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 5.5L7.5 9"
                      stroke="#3497F9"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle structured_payload messages (files/attachments)
  if (message.message_type === "structured_payload" && message.payload) {
    const payload = message.payload as {
      type?: string;
      filename?: string;
      fileSize?: string;
      fileType?: string;
    };

    if (payload.type === "file") {
      return (
        <div
          className={`flex ${isSent ? "justify-end" : "justify-start"} mb-2`}
        >
          <div
            className="relative max-w-[271px]"
            style={{
              filter: isSent
                ? "drop-shadow(0.5px 0.5px 0.8px rgba(0, 0, 0, 0.4))"
                : "none",
            }}
          >
            {/* File attachment bubble */}
            <div
              className="rounded-lg p-3"
              style={{
                backgroundColor: isSent ? "#1A1A1A" : "#F3F4F6",
                borderRadius: 8,
              }}
            >
              {/* File card */}
              <div
                className="flex items-center gap-3 rounded-md p-2"
                style={{ backgroundColor: "rgba(118, 118, 128, 0.12)" }}
              >
                {/* File icon */}
                <div
                  className="flex h-10 w-9 items-center justify-center rounded"
                  style={{ backgroundColor: "#FFFFFF", border: "0.4px solid #D1D1D6" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="2"
                      stroke="#007AFF"
                      strokeWidth="1.5"
                    />
                    <line x1="8" y1="9" x2="16" y2="9" stroke="#007AFF" strokeWidth="1.5" />
                    <line x1="8" y1="12" x2="14" y2="12" stroke="#007AFF" strokeWidth="1.5" />
                    <line x1="8" y1="15" x2="12" y2="15" stroke="#007AFF" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* File info */}
                <div className="flex flex-col">
                  <span
                    className="font-normal"
                    style={{
                      fontFamily: "Figtree",
                      fontSize: 16,
                      lineHeight: "19px",
                      color: isSent ? "#FFFFFF" : "#374151",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {payload.filename || "File"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="font-normal"
                      style={{
                        fontFamily: "Figtree",
                        fontSize: 15,
                        lineHeight: "18px",
                        color: isSent ? "#FFFFFF" : "#374151",
                      }}
                    >
                      {payload.fileSize || ""}
                    </span>
                    {payload.fileType && (
                      <>
                        <span
                          className="rounded-full"
                          style={{
                            width: 4,
                            height: 4,
                            backgroundColor: isSent ? "#FFFFFF" : "#374151",
                          }}
                        />
                        <span
                          className="font-normal"
                          style={{
                            fontFamily: "Figtree",
                            fontSize: 15,
                            lineHeight: "18px",
                            color: isSent ? "#FFFFFF" : "#374151",
                          }}
                        >
                          {payload.fileType}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamp and read receipt */}
              {showTimestamp && (
                <div
                  className={`mt-2 flex items-center gap-1 ${
                    isSent ? "justify-end" : "justify-start"
                  }`}
                >
                  <span
                    className="font-normal"
                    style={{
                      fontFamily: "Figtree",
                      fontSize: 13,
                      lineHeight: "16px",
                      color: isSent ? "#FFFFFF" : "rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    {formatTime(message.created_at)}
                  </span>

                  {isSent && (
                    <svg
                      width="14"
                      height="11"
                      viewBox="0 0 14 11"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 5.5L4.5 9L13 1"
                        stroke="#3497F9"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 5.5L7.5 9"
                        stroke="#3497F9"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  }

  // Handle system messages
  if (message.message_type === "system") {
    return (
      <div className="my-4 flex justify-center">
        <span
          className="rounded-full bg-gray-100 px-4 py-1 font-medium text-gray-500"
          style={{ fontFamily: "Figtree", fontSize: 12 }}
        >
          {message.body || "System message"}
        </span>
      </div>
    );
  }

  return null;
}
