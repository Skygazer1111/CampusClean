"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/shared/ui/button";

type Props = {
  /** Where to send the user after logout. Defaults to home. */
  callbackUrl?: string;
};

export function LogoutButton({ callbackUrl = "/" }: Props) {
  const [pending, setPending] = useState(false);

  async function onLogout() {
    if (pending) return;
    setPending(true);
    try {
      await signOut({ callbackUrl, redirect: false });
      window.location.assign(callbackUrl);
    } catch {
      // If Auth.js redirect throws or network fails, still leave the app shell.
      window.location.assign(callbackUrl);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      onClick={() => void onLogout()}
    >
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
