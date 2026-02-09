"use client";

import { usePathname } from "next/navigation";
import { ManagerBottomNav } from "@/components/layout/manager-bottom-nav";
import { cn } from "@/lib/utils";

export function ManagerLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Hide bottom nav on create listing and chat thread sub-pages
  const isCreateListing = pathname?.startsWith("/manager/listings/create");
  const isChatThread = /^\/manager\/messages\/[^/]+$/.test(pathname ?? "");
  const hideNav = isCreateListing || isChatThread;

  return (
    <div className={cn("min-h-screen font-sans", !hideNav && "pb-16")}>
      <main>{children}</main>
      {!hideNav && <ManagerBottomNav />}
    </div>
  );
}
