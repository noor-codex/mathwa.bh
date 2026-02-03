"use client";

import { TenantBottomNav } from "@/components/layout/tenant-bottom-nav";
import { SearchSheetOpenProvider, useSearchSheetOpen } from "@/lib/search-sheet-context";

function TenantLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSearchSheetOpen } = useSearchSheetOpen();
  return (
    <div className="min-h-screen pb-16 font-sans">
      <main>{children}</main>
      {!isSearchSheetOpen && <TenantBottomNav />}
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
