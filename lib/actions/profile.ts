"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type ActiveRole = "tenant" | "rental_manager";

export type Profile = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  roles: { tenant?: boolean; rental_manager?: boolean };
  active_role: ActiveRole;
  avatar_url: string | null;
  identity_verified: boolean;
  created_at: string;
  updated_at: string;
};

// ---------- Existing actions ----------

export async function switchRole(formData: FormData) {
  const role = formData.get("role") as ActiveRole;
  if (role && ["tenant", "rental_manager"].includes(role)) {
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
    rental_manager: "/manager/listings",
  };
  redirect(rolePaths[role]);
}

// ---------- New actions ----------

export async function getFullProfile(): Promise<{
  success: boolean;
  profile?: Profile;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("getFullProfile error:", error);
    return { success: false, error: error.message };
  }

  const profile: Profile = {
    user_id: data.user_id,
    display_name: data.display_name ?? null,
    email: data.email ?? user.email ?? null,
    phone: data.phone ?? null,
    roles: (data.roles as Profile["roles"]) ?? { tenant: true },
    active_role: data.active_role ?? "tenant",
    avatar_url: data.avatar_url ?? null,
    identity_verified: data.identity_verified ?? false,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return { success: true, profile };
}

export async function updateProfileField(
  field: "display_name" | "phone" | "email",
  value: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ [field]: value })
    .eq("user_id", user.id);

  if (error) {
    console.error("updateProfileField error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Current password is incorrect" };
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function deleteAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Delete user profile first (cascade should handle related data)
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("user_id", user.id);

  if (profileError) {
    console.error("deleteAccount profile error:", profileError);
    return { success: false, error: profileError.message };
  }

  // Sign out the user
  await supabase.auth.signOut();

  return { success: true };
}

export async function getPasswordLastUpdated(): Promise<{
  success: boolean;
  lastUpdated?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Use user.updated_at as a proxy for password last updated
  return {
    success: true,
    lastUpdated: user.updated_at,
  };
}
