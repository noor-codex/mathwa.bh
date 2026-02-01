"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DiscoverTabs({
  feed,
  sort,
}: {
  feed: string;
  sort: string;
}) {
  const pathname = usePathname();
  const baseUrl = pathname;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <Link
          href={`${baseUrl}?feed=rentals&sort=${sort}`}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium",
            feed === "rentals"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Rentals
        </Link>
        <Link
          href={`${baseUrl}?feed=uni-hub&sort=${sort}`}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium",
            feed === "uni-hub"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Uni Hub
        </Link>
      </div>
      <div className="flex gap-1 text-xs">
        <Link
          href={`${baseUrl}?feed=${feed}&sort=newest`}
          className={cn(
            "rounded px-2 py-1",
            sort === "newest" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Newest
        </Link>
        <Link
          href={`${baseUrl}?feed=${feed}&sort=price_asc`}
          className={cn(
            "rounded px-2 py-1",
            sort === "price_asc" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Price ↑
        </Link>
        <Link
          href={`${baseUrl}?feed=${feed}&sort=price_desc`}
          className={cn(
            "rounded px-2 py-1",
            sort === "price_desc" ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Price ↓
        </Link>
      </div>
    </div>
  );
}
