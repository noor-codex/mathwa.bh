"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ActionBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

const CLOSE_ANIMATION_MS = 300;

export function ActionBottomSheet({
  open,
  onOpenChange,
  children,
}: ActionBottomSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setDragOffset(0);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onOpenChange(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [isClosing, onOpenChange]);

  // Handle drag to close - works from anywhere on the sheet
  // Child components (like scroll wheels) can call e.stopPropagation() to prevent
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 100) {
      requestClose();
    } else {
      setDragOffset(0);
    }
    touchStartY.current = null;
  }, [dragOffset, requestClose]);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setDragOffset(0);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open && !isClosing) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        aria-hidden
        onClick={requestClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-[32px] bg-white",
          isClosing ? "animate-filter-sheet-close" : "animate-filter-sheet-open"
        )}
        style={{
          height: 489,
          maxHeight: "90vh",
          boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset > 0 ? "none" : undefined,
        }}
        role="dialog"
        aria-modal="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: "rgba(113, 113, 130, 0.3)" }}
          />
        </div>
        {/* Content */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-6",
            isClosing && "pointer-events-none"
          )}
        >
          {children}
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
