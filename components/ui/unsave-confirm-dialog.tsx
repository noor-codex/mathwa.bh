"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type UnsaveConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function UnsaveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: UnsaveConfirmDialogProps) {
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (isClosing || isLoading) return;
    setIsClosing(true);
    setTimeout(() => {
      onOpenChange(false);
      setIsClosing(false);
    }, 200);
  }, [isClosing, isLoading, onOpenChange]);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
    }
  }, [open]);

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
          "fixed inset-0 z-[70] bg-black/50 transition-opacity duration-200",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        aria-hidden
        onClick={requestClose}
      />
      {/* Dialog */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[75] -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        style={{
          width: 340,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="flex flex-col overflow-hidden rounded-[24px] bg-white"
          style={{ boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6"
            style={{
              height: 64,
              backgroundColor: "rgba(241, 245, 249, 0.8)",
            }}
          >
            <h2
              className="font-bold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
            >
              Unsave listing?
            </h2>
            <button
              type="button"
              onClick={requestClose}
              disabled={isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-50"
              style={{ backgroundColor: "rgba(241, 245, 249, 0.5)" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="#64748B"
                  strokeWidth="1.33"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col items-center px-6 py-6">
            <p
              className="text-center font-semibold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
            >
              You will have to re-save the listing if you continue.
            </p>
          </div>

          {/* Divider */}
          <div className="h-[1px] w-full bg-[#E2E8F0]" />

          {/* Footer buttons */}
          <div className="flex gap-3 px-6 py-4">
            {/* Cancel button */}
            <button
              type="button"
              onClick={requestClose}
              disabled={isLoading}
              className="flex h-[43px] flex-1 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white disabled:opacity-50"
            >
              <span
                className="font-bold text-[#0F172A]"
                style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
              >
                Cancel
              </span>
            </button>

            {/* Unsave button */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex h-[43px] flex-1 items-center justify-center rounded-[10px] bg-[#1A1A1A] disabled:opacity-50"
              style={{
                boxShadow: "0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <span
                className="font-bold text-white"
                style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
              >
                {isLoading ? "Unsaving..." : "Unsave"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
