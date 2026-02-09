"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { updateActiveRole } from "@/lib/actions/profile";

type ProfileRentCardProps = {
  hasManagerRole: boolean;
};

export function ProfileRentCard({ hasManagerRole }: ProfileRentCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback(() => {
    if (hasManagerRole) {
      // Switch to rental manager role
      startTransition(async () => {
        await updateActiveRole("rental_manager");
      });
    } else {
      // Navigate to become-manager onboarding
      router.push("/become-manager");
    }
  }, [hasManagerRole, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex w-full items-center justify-between disabled:opacity-70"
      style={{
        height: 134,
        padding: "0 25px",
        background: "#FFFFFF",
        border: "1px solid #F3F4F6",
        boxShadow: "0px 2px 4px -2px rgba(0, 0, 0, 0.1)",
        borderRadius: 16,
      }}
    >
      {/* Text */}
      <div className="flex flex-col items-start justify-center gap-2">
        <span
          className="font-bold text-[#0A0A0A]"
          style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
        >
          Rent your property
        </span>
        <span
          className="text-left font-normal text-[#4A5565]"
          style={{
            fontFamily: "Figtree",
            fontSize: 14,
            lineHeight: "17px",
            maxWidth: 190,
          }}
        >
          An official platform made for private owners to list rentals, with no commission fees.
        </span>
      </div>

      {/* Mathwa logo box */}
      <Image
        src="/icons/mathwa-logo-card.svg"
        alt="Mathwa"
        width={106}
        height={106}
        className="shrink-0"
        style={{ borderRadius: 20 }}
      />
    </button>
  );
}
