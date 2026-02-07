"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      setAttachmentOpen(false);
      inputRef.current?.focus();
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const toggleAttachment = useCallback(() => {
    setAttachmentOpen((prev) => {
      const next = !prev;
      // If opening the picker, blur input to dismiss keyboard on mobile
      if (next) {
        inputRef.current?.blur();
      }
      return next;
    });
  }, []);

  const handlePhotos = useCallback(() => {
    // TODO: Implement photo picker
    setAttachmentOpen(false);
  }, []);

  const handleDocuments = useCallback(() => {
    // TODO: Implement document picker
    setAttachmentOpen(false);
  }, []);

  const handleInputFocus = useCallback(() => {
    // Close attachment picker when input gets focus (keyboard opens)
    setAttachmentOpen(false);
  }, []);

  return (
    <div className="flex flex-shrink-0 flex-col">
      {/* Input bar */}
      <div
        className="flex items-center justify-center gap-[30px] bg-white px-0 pt-[10px] pb-5"
        style={{
          boxShadow: attachmentOpen ? "none" : "0px -4px 5px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Attachment button (+) */}
        <button
          type="button"
          onClick={toggleAttachment}
          disabled={disabled}
          className="flex h-[50px] flex-shrink-0 items-center justify-center disabled:opacity-50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transition: "transform 0.2s ease",
              transform: attachmentOpen ? "rotate(45deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M8 1V15M1 8H15"
              stroke="#1A1A1A"
              strokeWidth="2.33"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Text input */}
        <div
          className="flex flex-1 items-center rounded-full px-4"
          style={{
            backgroundColor: "#F2F3F5",
            height: 50,
            maxWidth: 230,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent font-normal text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:outline-none disabled:opacity-50"
            style={{
              fontFamily: "Figtree",
              fontSize: 16,
              lineHeight: "19px",
            }}
          />
        </div>

        {/* Send button (shows when there's text) */}
        {message.trim() && (
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled}
            className="flex h-[50px] flex-shrink-0 items-center justify-center disabled:opacity-50"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11"
                stroke="#1A1A1A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Attachment picker panel */}
      {attachmentOpen && (
        <div
          className="flex items-start justify-center bg-white px-5 pt-5 pb-5"
          style={{
            boxShadow: "0px -4px 5px rgba(0, 0, 0, 0.05)",
            borderRadius: "20px 20px 0px 0px",
            height: 266,
          }}
        >
          <div className="flex gap-[10px]">
            {/* Photos */}
            <button
              type="button"
              onClick={handlePhotos}
              className="flex flex-col items-center justify-center gap-[13px] rounded-[10px] p-[5px]"
              style={{
                width: 68,
                height: 81,
                backgroundColor: "#F3F4F6",
              }}
            >
              <Image
                src="/icons/photo.svg"
                alt="Photos"
                width={24}
                height={24}
              />
              <span
                className="font-medium text-[#111111]"
                style={{ fontFamily: "Figtree", fontSize: 11, lineHeight: "13px" }}
              >
                Photos
              </span>
            </button>

            {/* Documents */}
            <button
              type="button"
              onClick={handleDocuments}
              className="flex flex-col items-center justify-center gap-[13px] rounded-[10px] p-[5px]"
              style={{
                width: 68,
                height: 81,
                backgroundColor: "#F3F4F6",
              }}
            >
              <Image
                src="/icons/file.svg"
                alt="Documents"
                width={18}
                height={22}
              />
              <span
                className="font-medium text-[#111111]"
                style={{ fontFamily: "Figtree", fontSize: 11, lineHeight: "13px" }}
              >
                Documents
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
