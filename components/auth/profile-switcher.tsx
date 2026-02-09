"use client";

import Link from "next/link";
import { switchRole } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import type { ActiveRole } from "@/lib/actions/profile";

type ProfileSwitcherProps = {
  activeRole: string;
  roles: { tenant?: boolean; rental_manager?: boolean };
};

const roleLabels: Record<ActiveRole, string> = {
  tenant: "Tenant",
  rental_manager: "Rental Manager",
};

const rolePaths: Record<ActiveRole, string> = {
  tenant: "/discover",
  rental_manager: "/manager/listings",
};

export function ProfileSwitcher({ activeRole, roles }: ProfileSwitcherProps) {
  const availableRoles = (["tenant", "rental_manager"] as const).filter(
    (r) => roles[r as keyof typeof roles]
  );

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm font-medium">
        Switch interface
      </p>
      <div className="flex flex-wrap gap-2">
        {availableRoles.map((role) => {
          const isActive = activeRole === role;
          return isActive ? (
            <Button key={role} variant="default" size="sm" disabled>
              {roleLabels[role]}
            </Button>
          ) : (
            <form key={role} action={switchRole}>
              <input type="hidden" name="role" value={role} />
              <Button type="submit" variant="outline" size="sm">
                {roleLabels[role]}
              </Button>
            </form>
          );
        })}
      </div>

      {/* Show "Become a Rental Manager" CTA if user doesn't have the role */}
      {!roles.rental_manager && (
        <Link
          href="/become-manager"
          className="inline-block text-sm text-primary underline"
        >
          Become a Rental Manager
        </Link>
      )}
    </div>
  );
}
