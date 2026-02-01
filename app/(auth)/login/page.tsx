import Link from "next/link";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect || "/discover";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Log in</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to chat, book tours, and save listings.
          </p>
        </div>

        <LoginForm redirectTo={redirectTo} />

        {params.error === "auth" && (
          <p className="text-destructive text-center text-sm">
            Authentication failed. Please try again.
          </p>
        )}

        <p className="text-center text-muted-foreground text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-primary underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
