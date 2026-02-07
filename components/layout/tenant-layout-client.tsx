"use client";

import { usePathname } from "next/navigation";
import { TenantBottomNav } from "@/components/layout/tenant-bottom-nav";
import { SearchSheetOpenProvider, useSearchSheetOpen } from "@/lib/search-sheet-context";
import { cn } from "@/lib/utils";

function TenantLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSearchSheetOpen } = useSearchSheetOpen();
  const isListingDetail = pathname?.startsWith("/listing/") && pathname !== "/listing";
  // Hide bottom nav when inside a chat thread (full-screen chat view)
  const isChatThread = /^\/messages\/[^/]+$/.test(pathname ?? "");
  const hideNav = isSearchSheetOpen || isListingDetail || isChatThread;
  return (
    <div className={cn("min-h-screen font-sans", !hideNav && "pb-16")}>
      <main>{children}</main>
      {!hideNav && <TenantBottomNav />}
    </div>
  );
}

export function TenantLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchSheetOpenProvider>
      <TenantLayoutInner>{children}</TenantLayoutInner>
    </SearchSheetOpenProvider>
  );
}
