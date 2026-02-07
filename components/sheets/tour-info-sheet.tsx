"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TourInfoSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  tourDate: Date;
  lat: number | null;
  lng: number | null;
};

const CLOSE_ANIMATION_MS = 300;

function formatTourDate(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  
  // Add ordinal suffix
  let suffix = "th";
  if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = "st";
  else if (dayNum === 2 || dayNum === 22) suffix = "nd";
  else if (dayNum === 3 || dayNum === 23) suffix = "rd";
  
  // Format time
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const timeStr = `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  
  return `Tour is on ${dayName}, ${monthName} ${dayNum}${suffix}\n${timeStr}`;
}

export function TourInfoSheet({
  open,
  onOpenChange,
  listingTitle,
  tourDate,
  lat,
  lng,
}: TourInfoSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (dragOffset > 80) {
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

  const handleGetDirections = useCallback(() => {
    if (lat != null && lng != null) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    }
  }, [lat, lng]);

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
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-[32px] bg-white",
          isClosing ? "animate-filter-sheet-close" : "animate-filter-sheet-open"
        )}
        style={{
          height: 215,
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
        <div className="flex flex-1 flex-col items-center gap-5 px-6 pb-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-0">
            <h2
              className="font-extrabold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
            >
              Your tour booking info
            </h2>
            <p
              className="text-center font-bold text-[#717182]"
              style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
            >
              For {listingTitle}
            </p>
          </div>

          {/* Tour date/time */}
          <div
            className="whitespace-pre-line text-center font-semibold text-[#0A0A0A]"
            style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
          >
            {formatTourDate(tourDate)}
          </div>

          {/* Get directions */}
          {lat != null && lng != null && (
            <button
              type="button"
              onClick={handleGetDirections}
              className="font-bold text-[#717182] underline"
              style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
            >
              Get directions
            </button>
          )}
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
