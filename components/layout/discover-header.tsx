"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DiscoverTabs } from "@/app/(tenant)/discover/discover-tabs";
import { DiscoverFilterSheet } from "@/app/(tenant)/discover/discover-filter-sheet";
import { DiscoverSearchSheet } from "@/app/(tenant)/discover/discover-search-sheet";
import { useSearchSheetOpen } from "@/lib/search-sheet-context";

const SHRINK_THRESHOLD = 100;
const EXPAND_THRESHOLD = 5;

export function DiscoverHeader({ feed }: { feed: string }) {
  const pathname = usePathname();
  const baseUrl = pathname;
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrolledRef = useRef(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { isSearchSheetOpen: searchOpen, setSearchSheetOpen: setSearchOpen } = useSearchSheetOpen();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const next = lastScrolledRef.current
        ? scrollY > EXPAND_THRESHOLD
        : scrollY > SHRINK_THRESHOLD;
      // #region agent log
      if (next !== lastScrolledRef.current) {
        fetch('http://127.0.0.1:7244/ingest/bff4b066-40a0-461e-b54e-d2776d14053d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'discover-header.tsx:handleScroll',message:'isScrolled toggle',data:{scrollY,shrinkAt:SHRINK_THRESHOLD,expandAt:EXPAND_THRESHOLD,prev:lastScrolledRef.current,next},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      }
      // #endregion
      if (next !== lastScrolledRef.current) {
        lastScrolledRef.current = next;
        setIsScrolled(next);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-[#FFFFFF] shadow-[0px_5px_10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto max-w-xl px-4 sm:max-w-2xl lg:max-w-4xl">
      <div className="flex items-center justify-between gap-4 py-3">
        <button
          type="button"
          aria-label="Filters"
          className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--discover-black)]"
          onClick={() => setFilterOpen(true)}
        >
          <Image
            src="/icons/filter.svg"
            alt=""
            width={21}
            height={24}
            className="h-6 w-5"
          />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-6">
          <div className="flex items-baseline gap-6">
            <Link
              href={`${baseUrl}?feed=uni-hub`}
              className={cn(
                "relative shrink-0 rounded px-2 pb-1 pt-1 text-xl",
                feed === "uni-hub"
                  ? "font-semibold text-[#1A1A1A]"
                  : "font-medium text-[#374151] hover:text-[#1A1A1A]"
              )}
            >
              Uni Hub
              {feed === "uni-hub" && (
                <span
                  className="absolute bottom-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded bg-[#1A1A1A]"
                  aria-hidden
                />
              )}
            </Link>
            <Link
              href={`${baseUrl}?feed=rentals`}
              className={cn(
                "relative shrink-0 rounded px-2 pb-1 pt-1 text-xl",
                feed === "rentals"
                  ? "font-semibold text-[#1A1A1A]"
                  : "font-medium text-[#374151] hover:text-[#1A1A1A]"
              )}
            >
              Rentals
              {feed === "rentals" && (
                <span
                  className="absolute bottom-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded bg-[#1A1A1A]"
                  aria-hidden
                />
              )}
            </Link>
          </div>
        </div>

        <button
          type="button"
          aria-label="Search"
          className="flex h-10 w-10 shrink-0 items-center justify-center text-[var(--discover-black)]"
          onClick={() => setSearchOpen(true)}
        >
          <Image
            src="/icons/search.svg"
            alt=""
            width={25}
            height={25}
            className="h-6 w-6"
          />
        </button>
      </div>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isScrolled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex justify-center pb-3">
            <Suspense fallback={<div className="h-9 w-48 rounded-[10px] bg-[#F3F4F6]" />}>
              <DiscoverTabs feed={feed} />
            </Suspense>
          </div>
        </div>
      </div>
      </div>
      <DiscoverFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        feed={feed}
      />
      <DiscoverSearchSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        feed={feed}
      />
    </header>
  );
}
