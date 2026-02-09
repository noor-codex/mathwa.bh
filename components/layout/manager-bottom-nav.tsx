"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Mail01Icon,
  Home07Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/manager/tours", label: "Tours", icon: Calendar03Icon },
  { href: "/manager/messages", label: "Messages", icon: Mail01Icon },
  { href: "/manager/listings", label: "Listings", icon: Home07Icon },
  { href: "/manager/profile", label: "Profile", icon: UserIcon },
];

export function ManagerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background safe-area-pb">
      <div className="flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
                isActive
                  ? "font-medium text-[var(--discover-black)]"
                  : "text-[var(--discover-grey-muted)]"
              )}
            >
              <HugeiconsIcon icon={Icon} className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
