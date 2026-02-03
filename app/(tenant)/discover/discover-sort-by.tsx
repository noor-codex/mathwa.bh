"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

const DEFAULT_SORT = "newest";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "price_asc", label: "Lowest priced" },
  { value: "price_desc", label: "Highest priced" },
  { value: "featured_first", label: "Featured" },
  { value: "area_sqm_first", label: "m2" },
  { value: "newest", label: "Recently renewed" },
];

export function DiscoverSortBy({
  feed,
  sort,
}: {
  feed: string;
  sort: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (s: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("feed", feed);
    p.set("sort", s);
    return `${pathname}?${p.toString()}`;
  };

  const currentLabel =
    sort === DEFAULT_SORT
      ? "Sort by"
      : SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort by";

  const hasSortSelected = sort !== DEFAULT_SORT;
  const clearHref = buildHref(DEFAULT_SORT);

  return (
    <DropdownMenu>
      <div className="flex shrink-0 items-center gap-1">
        {hasSortSelected && (
          <Link
            href={clearHref}
            onClick={(e) => e.stopPropagation()}
            aria-label="Remove sort"
            className="flex items-center justify-center rounded p-0.5 text-[var(--discover-grey)] hover:bg-[#F3F4F6] hover:text-[var(--discover-black)]"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
          </Link>
        )}
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="shrink-0 text-sm font-normal text-[var(--discover-grey)] hover:bg-transparent hover:text-[var(--discover-black)]"
          >
            {currentLabel}
          </Button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} asChild>
            <Link href={buildHref(opt.value)}>{opt.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
