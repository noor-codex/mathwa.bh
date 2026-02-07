"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ContentBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
};

const CLOSE_ANIMATION_MS = 300;

export function ContentBottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: ContentBottomSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onOpenChange(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [isClosing, onOpenChange]);

  useEffect(() => {
    if (open) setIsClosing(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  if (!open && !isClosing) return null;

  const content = (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/50"
        aria-hidden
        onClick={requestClose}
      />
      <div
        className={cn(
          "flex flex-col rounded-t-[32px] bg-white shadow-[0px_5px_15px_-12px_rgba(0,0,0,0.1)]",
          isClosing ? "animate-filter-sheet-close" : "animate-filter-sheet-open"
        )}
        style={{
          position: "fixed",
          zIndex: 60,
          left: 0,
          top: 40,
          right: 0,
          bottom: 0,
          width: "100vw",
          maxWidth: "100%",
          boxSizing: "border-box",
          margin: 0,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain rounded-t-[20px] bg-white px-6 py-5",
            isClosing && "pointer-events-none"
          )}
        >
          <div className="flex items-center justify-between gap-3 pb-4">
            <h2
              className="font-medium text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "23px" }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-[#0A0A0A] hover:bg-black/5 active:bg-black/10"
            >
              <X className="h-6 w-6 stroke-[2]" />
            </button>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
