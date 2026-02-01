"use client";

import Link from "next/link";
import { switchRole } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import type { ActiveRole } from "@/lib/actions/profile";

type ProfileSwitcherProps = {
  activeRole: string;
  roles: { tenant?: boolean; agent?: boolean; landlord?: boolean };
};

const roleLabels: Record<ActiveRole, string> = {
  tenant: "Browse",
  agent: "Agent",
  landlord: "Landlord",
};

const rolePaths: Record<ActiveRole, string> = {
  tenant: "/discover",
  agent: "/agent/today",
  landlord: "/landlord/today",
};

export function ProfileSwitcher({ activeRole, roles }: ProfileSwitcherProps) {
  const availableRoles = (["tenant", "agent", "landlord"] as const).filter(
    (r) => roles[r as keyof typeof roles]
  );

  if (availableRoles.length <= 1) return null;

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
      <p className="text-muted-foreground text-xs">
        Or{" "}
        {availableRoles
          .filter((r) => r !== activeRole)
          .map((role, i) => (
            <span key={role}>
              {i > 0 && ", "}
              <Link href={rolePaths[role]} className="text-primary underline">
                open {roleLabels[role]} dashboard
              </Link>
            </span>
          ))}
      </p>
    </div>
  );
}
