"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function DiscoverTabs({ feed }: { feed: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseUrl = pathname;

  const tab = searchParams.get("tab") ?? "current-search";
  const isNewest = tab === "newest";
  const isCurrentSearch = tab === "current-search";
  const isPopular = tab === "popular";

  const sort = searchParams.get("sort") ?? "newest";
  const buildHref = (t: string, s: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("feed", feed);
    p.set("tab", t);
    p.set("sort", s);
    return `${baseUrl}?${p.toString()}`;
  };

  const pillBase =
    "rounded-[10px] bg-[#F3F4F6] px-4 py-2 text-[17px] text-[#374151] transition-colors";
  const activePill = "font-semibold ring-1 ring-inset ring-[#374151]";
  const inactivePill = "font-normal";

  return (
    <div className="flex justify-center gap-1">
      <Link
        href={buildHref("newest", "newest")}
        className={cn(
          pillBase,
          isNewest ? activePill : inactivePill
        )}
      >
        Newest
      </Link>
      <Link
        href={buildHref("current-search", sort)}
        className={cn(
          pillBase,
          isCurrentSearch ? activePill : inactivePill
        )}
      >
        Current Search
      </Link>
      <Link
        href={buildHref("popular", "price_desc")}
        className={cn(
          pillBase,
          isPopular ? activePill : inactivePill
        )}
      >
        Popular
      </Link>
    </div>
  );
}
