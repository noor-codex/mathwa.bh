"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { switchRole } from "@/lib/actions/profile";

export function ManagerProfileActions() {
  const [isPending, startTransition] = useTransition();

  function handleSwitchToTenant() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("role", "tenant");
      await switchRole(formData);
    });
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleSwitchToTenant}
        disabled={isPending}
      >
        Switch to Tenant Mode
      </Button>
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
        disabled={isPending}
      >
        Sign Out
      </Button>
    </>
  );
}
