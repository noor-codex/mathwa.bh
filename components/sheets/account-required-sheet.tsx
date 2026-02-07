"use client";

import Link from "next/link";
import { ActionBottomSheet } from "@/components/ui/action-bottom-sheet";
import { signInWithGoogle } from "@/lib/actions/auth";

type AccountRequiredSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  context?: "book_tour" | "chat";
};

export function AccountRequiredSheet({
  open,
  onOpenChange,
  listingId,
  context = "book_tour",
}: AccountRequiredSheetProps) {
  const redirectUrl = `/listing/${listingId}${context === "book_tour" ? "?action=book_tour" : "?action=chat"}`;

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(redirectUrl);
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  const subtitle =
    context === "book_tour"
      ? "To book a tour, you must have an account."
      : "To chat with the agent, you must have an account.";

  return (
    <ActionBottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center gap-5">
        {/* Header */}
        <div className="flex flex-col items-center gap-0">
          <h2
            className="font-extrabold text-[#0A0A0A]"
            style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
          >
            Account required
          </h2>
          <p
            className="text-center font-bold text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
          >
            {subtitle}
          </p>
        </div>

        {/* Sign in buttons */}
        <div className="flex w-full flex-col gap-3">
          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-[54px] w-full items-center justify-center gap-[5px] rounded-[14px] bg-black px-[15px]"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.8055 10.0415C19.8055 9.40083 19.7499 8.80083 19.6499 8.22583H10.2V11.5875H15.6033C15.3633 12.8542 14.6483 13.9208 13.5816 14.6358V17.1858H16.8233C18.7033 15.4542 19.8055 12.9708 19.8055 10.0415Z" fill="white"/>
              <path d="M10.2 19.5999C12.9533 19.5999 15.2716 18.6699 16.8233 17.1857L13.5816 14.6357C12.6516 15.2357 11.48 15.5999 10.2 15.5999C7.54831 15.5999 5.29497 13.8449 4.46497 11.4399H1.12164V14.0699C2.66497 17.1324 5.87497 19.5999 10.2 19.5999Z" fill="white"/>
              <path d="M4.465 11.44C4.265 10.84 4.155 10.2 4.155 9.54C4.155 8.88 4.265 8.24 4.465 7.64V5.01H1.12167C0.405 6.43 0 8.03 0 9.54C0 11.05 0.405 12.65 1.12167 14.07L4.465 11.44Z" fill="white"/>
              <path d="M10.2 3.48C11.5883 3.48 12.8383 3.97 13.8233 4.93L16.895 1.86C15.2716 0.31 12.9533 -0.4 10.2 -0.4C5.87497 -0.4 2.66497 2.06833 1.12164 5.01L4.46497 7.64C5.29497 5.235 7.54831 3.48 10.2 3.48Z" fill="white"/>
            </svg>
            <span
              className="font-semibold text-white"
              style={{ fontFamily: "Figtree", fontSize: 19, lineHeight: "24px" }}
            >
              Continue with Google
            </span>
          </button>

          {/* Continue with Email */}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
            className="flex h-[54px] w-full items-center justify-center gap-[5px] rounded-[14px] border border-black bg-white px-[15px]"
          >
            <span
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 19, lineHeight: "23px" }}
            >
              Continue with Email
            </span>
          </Link>

          {/* Continue with Phone */}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}&method=phone`}
            className="flex h-[54px] w-full items-center justify-center gap-[5px] rounded-[14px] border border-black bg-white px-[15px]"
          >
            <span
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 19, lineHeight: "23px" }}
            >
              Continue with Phone
            </span>
          </Link>
        </div>

        {/* Already have an account */}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
          className="font-bold text-[#717182]"
          style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
        >
          Already have an account?
        </Link>
      </div>
    </ActionBottomSheet>
  );
}
