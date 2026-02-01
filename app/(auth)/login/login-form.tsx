"use client";

import { useActionState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      formData.set("redirect", redirectTo);
      return await signIn(formData);
    },
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <FieldGroup>
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
            autoComplete="current-password"
          />
        </Field>
      </FieldGroup>
      {state?.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
