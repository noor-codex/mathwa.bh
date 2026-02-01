"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string; message?: string } | null, formData: FormData) => {
      return await signUp(formData);
    },
    null
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign up</h1>
          <p className="text-muted-foreground text-sm">
            Create an account to chat, book tours, and save listings.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>First name</FieldLabel>
              <Input
                name="firstName"
                type="text"
                placeholder="Jane"
                required
                autoComplete="given-name"
              />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </Field>
          </FieldGroup>
          {state?.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}
          {state?.message && (
            <p className="text-muted-foreground text-sm">{state.message}</p>
          )}
          <Button type="submit" className="w-full">
            Sign up
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
