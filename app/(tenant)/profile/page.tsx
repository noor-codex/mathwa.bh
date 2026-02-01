import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { ProfileSwitcher } from "@/components/auth/profile-switcher";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in to access your profile and saved listings.
        </p>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, roles, active_role")
    .eq("user_id", user.id)
    .single();

  const roles = (profile?.roles as { tenant?: boolean; agent?: boolean; landlord?: boolean }) ?? {
    tenant: true,
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="space-y-2">
        <p className="font-medium">
          {profile?.display_name || user.email?.split("@")[0] || "User"}
        </p>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </div>

      <ProfileSwitcher
        activeRole={profile?.active_role ?? "tenant"}
        roles={roles}
      />

      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
