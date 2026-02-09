"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

type ProfileBackButtonProps = {
  href?: string;
};

export function ProfileBackButton({ href }: ProfileBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F4F6]"
      aria-label="Back"
      style={{ marginLeft: 5 }}
    >
      <Image src="/icons/back-arrow.svg" alt="" width={14} height={14} />
    </button>
  );
}
