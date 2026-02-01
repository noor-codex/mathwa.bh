"use client";

import Link from "next/link";
import { useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import { toggleSave } from "@/lib/actions/listings";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bookmark02Icon, Mail01Icon, Calendar03Icon } from "@hugeicons/core-free-icons";

export function ListingDetailActions({
  listingId,
  saved: initialSaved,
  isLoggedIn,
}: {
  listingId: string;
  saved: boolean;
  isLoggedIn: boolean;
}) {
  const [saved, setSaved] = useOptimistic(initialSaved);

  return (
    <div className="flex flex-wrap gap-2">
      {isLoggedIn ? (
        <>
          <form
            action={async (fd) => {
              setSaved(!saved);
              await toggleSave(fd);
            }}
          >
            <input type="hidden" name="listingId" value={listingId} />
            <Button type="submit" variant={saved ? "default" : "outline"} size="sm">
              <HugeiconsIcon icon={Bookmark02Icon} className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              {saved ? "Saved" : "Save"}
            </Button>
          </form>
          <Button asChild variant="default" size="sm">
            <Link href={`/messages?listing=${listingId}`}>
              <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4" />
              Chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/messages?listing=${listingId}&book=tour`}>
              <HugeiconsIcon icon={Calendar03Icon} className="h-4 w-4" />
              Book tour
            </Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild variant="outline" size="sm">
            <Link href={`/login?redirect=/listing/${listingId}`}>
              <HugeiconsIcon icon={Bookmark02Icon} className="h-4 w-4" />
              Save
            </Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href={`/login?redirect=/listing/${listingId}`}>
              <HugeiconsIcon icon={Mail01Icon} className="h-4 w-4" />
              Chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/login?redirect=/listing/${listingId}`}>
              <HugeiconsIcon icon={Calendar03Icon} className="h-4 w-4" />
              Book tour
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}
