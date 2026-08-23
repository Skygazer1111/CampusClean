"use client";

import { useActionState } from "react";
import {
  setCitizenPasswordAction,
  updateProfileAction,
} from "@/features/profile/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { FormErrorBanner } from "@/shared/ui/field-error";

type Props = {
  name: string;
  phone: string;
  email: string;
  hasPassword: boolean;
};

export function ProfileForm({
  name,
  phone,
  email,
  hasPassword,
}: Props) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    undefined,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    setCitizenPasswordAction,
    undefined,
  );

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled />
          <p className="mt-1.5 text-xs text-ink-muted">
            Sign in with your password. Email codes remain available as a
            backup.
          </p>
        </div>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" defaultValue={name} required />
        </div>
        <div>
          <Label htmlFor="phone">Mobile</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            defaultValue={phone}
            required
          />
        </div>

        <FormErrorBanner message={state?.error} />
        {state?.ok ? (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-status-resolved"
          >
            Profile updated.
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <form action={passwordAction} className="space-y-5 border-t border-line/70 pt-8" noValidate>
        <div>
          <h3 className="font-display text-lg font-semibold">
            {hasPassword ? "Change password" : "Set a password"}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {hasPassword
              ? "Update the password you use on the citizen sign-in page."
              : "Add a password so you do not need an email code every time."}
          </p>
        </div>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <FormErrorBanner message={passwordState?.error} />
        {passwordState?.ok ? (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-status-resolved"
          >
            Password saved. You can sign in with email and password next time.
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          disabled={passwordPending}
          aria-busy={passwordPending}
        >
          {passwordPending
            ? "Saving…"
            : hasPassword
              ? "Update password"
              : "Save password"}
        </Button>
      </form>
    </div>
  );
}
