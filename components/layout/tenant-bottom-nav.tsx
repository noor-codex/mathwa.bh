"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  Bookmark02Icon,
  Home07Icon,
  Mail01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/discover", label: "Discover", icon: SearchIcon },
  { href: "/saved", label: "Saved", icon: Bookmark02Icon },
  { href: "/my-home", label: "My Home", icon: Home07Icon },
  { href: "/messages", label: "Messages", icon: Mail01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function TenantBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background safe-area-pb">
      <div className="flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
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
