"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ActiveRole = "tenant" | "agent" | "landlord";

export async function switchRole(formData: FormData) {
  const role = formData.get("role") as ActiveRole;
  if (role && ["tenant", "agent", "landlord"].includes(role)) {
    await updateActiveRole(role);
  }
}

export async function updateActiveRole(role: ActiveRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ active_role: role })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  const rolePaths: Record<ActiveRole, string> = {
    tenant: "/discover",
    agent: "/agent/today",
    landlord: "/landlord/today",
  };
  redirect(rolePaths[role]);
}
