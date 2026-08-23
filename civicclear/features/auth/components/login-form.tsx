"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  beginStaffSetupAction,
  completeStaffSetupAction,
  requestCitizenOtpAction,
  verifyCitizenOtpAction,
} from "@/features/auth/actions";
import { homePathForRole } from "@/features/auth/schemas";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { FormErrorBanner } from "@/shared/ui/field-error";

type LoginMode = "password" | "otp" | "staff-setup";

export function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("password");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"admin" | "official">("official");
  const [staffDevCode, setStaffDevCode] = useState<string | undefined>();

  if (mode === "otp") {
    return <OtpLogin onUsePassword={() => setMode("password")} />;
  }

  if (mode === "staff-setup") {
    return (
      <StaffSetupForm
        email={staffEmail}
        role={staffRole}
        initialDevCode={staffDevCode}
        onBack={() => {
          setMode("password");
          setStaffDevCode(undefined);
        }}
      />
    );
  }

  return (
    <PasswordLogin
      onUseOtp={() => setMode("otp")}
      onStaffSetup={(email, role, devCode) => {
        setStaffEmail(email);
        setStaffRole(role);
        setStaffDevCode(devCode);
        setMode("staff-setup");
      }}
    />
  );
}

async function redirectAfterSignIn(
  router: ReturnType<typeof useRouter>,
  fallback: string,
) {
  const session = await getSession();
  const path = homePathForRole(session?.user?.role) || fallback;
  router.push(path);
  router.refresh();
}

function PasswordLogin({
  onUseOtp,
  onStaffSetup,
}: {
  onUseOtp: () => void;
  onStaffSetup: (
    email: string,
    role: "admin" | "official",
    devCode?: string,
  ) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .toLowerCase()
      .trim();
    const password = String(formData.get("password") ?? "");

    try {
      const setupData = new FormData();
      setupData.set("email", email);
      const setup = await beginStaffSetupAction(undefined, setupData);

      if (setup && "error" in setup && setup.error) {
        setError(setup.error);
        setPending(false);
        return;
      }

      if (setup && "removedAccount" in setup && setup.removedAccount) {
        setError(
          "That account was removed. Create a new student account, or ask an admin to invite this email again.",
        );
        setPending(false);
        return;
      }

      if (setup && "ok" in setup && setup.ok && "role" in setup) {
        onStaffSetup(
          email,
          setup.role === "admin" ? "admin" : "official",
          "devCode" in setup ? setup.devCode : undefined,
        );
        setPending(false);
        return;
      }

      if (password.length < 8) {
        setError("Enter your password (at least 8 characters).");
        setPending(false);
        return;
      }

      const result = await signIn("password", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          "Email or password is incorrect. Students can create an account or use an email code once to set a password.",
        );
        setPending(false);
        return;
      }

      await redirectAfterSignIn(router, "/");
    } catch {
      setError("Could not sign in. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          First-time admin or coordinator? Enter your invited email and continue
          — we will email a code so you can set your details.
        </p>
      </div>
      <FormErrorBanner message={error} />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Signing in…" : "Continue"}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm font-medium text-accent hover:underline disabled:opacity-50"
        disabled={pending}
        onClick={onUseOtp}
      >
        Student? Use email code instead
      </button>
      <p className="text-center text-sm text-ink-muted">
        New student?{" "}
        <Link
          href="/register"
          className="font-medium text-accent hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

function StaffSetupForm({
  email,
  role,
  initialDevCode,
  onBack,
}: {
  email: string;
  role: "admin" | "official";
  initialDevCode?: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [devCode, setDevCode] = useState(initialDevCode);
  const [resendIn, setResendIn] = useState(30);
  const roleLabel = role === "admin" ? "admin" : "coordinator";

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  async function resendCode() {
    if (resendIn > 0 || pending) return;
    setError(null);
    setInfo(null);
    setPending(true);
    const formData = new FormData();
    formData.set("email", email);
    const setup = await beginStaffSetupAction(undefined, formData);
    setPending(false);

    if (setup && "error" in setup && setup.error) {
      setError(setup.error);
      return;
    }
    if (setup && "ok" in setup && setup.ok) {
      setDevCode("devCode" in setup ? setup.devCode : undefined);
      setResendIn(30);
      setInfo("A new code was sent. Use the latest email.");
      return;
    }
    setError("This account already has a password. Sign in with it.");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("email", email);

    try {
      const completed = await completeStaffSetupAction(undefined, formData);
      if (completed && "error" in completed && completed.error) {
        setError(completed.error);
        setPending(false);
        return;
      }

      const password = String(formData.get("password") ?? "");
      const result = await signIn("password", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          "Your account is ready, but sign-in failed. Try the password you just set.",
        );
        setPending(false);
        return;
      }

      await redirectAfterSignIn(router, role === "admin" ? "/admin" : "/queue");
    } catch {
      setError("Could not finish setup. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <p className="rounded-2xl bg-accent-soft/70 px-3.5 py-3 text-sm text-ink-muted">
        We recognised this {roleLabel} email. Enter the 6-digit code sent to{" "}
        <span className="font-semibold text-ink">{email}</span>, then set your
        name, mobile, and password.
        {devCode ? (
          <>
            {" "}
            <span className="font-semibold text-accent">Dev code: {devCode}</span>
          </>
        ) : null}
      </p>

      <div>
        <Label htmlFor="code">Setup code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          required
          pattern="\d{6}"
          maxLength={6}
        />
      </div>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="phone">Mobile</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10-digit number"
          required
          pattern="[0-9]{10}"
          maxLength={10}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
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
      <FormErrorBanner message={error} />
      {info ? (
        <p
          role="status"
          className="rounded-xl bg-accent-soft/80 px-3 py-2 text-sm text-accent"
        >
          {info}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Saving…" : "Save and sign in"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        disabled={pending || resendIn > 0}
        onClick={() => void resendCode()}
      >
        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm font-medium text-ink-muted hover:text-ink hover:underline disabled:opacity-50"
        disabled={pending}
        onClick={onBack}
      >
        Use a different email
      </button>
    </form>
  );
}

function OtpLogin({ onUsePassword }: { onUsePassword: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  async function sendCode(targetEmail: string) {
    const formData = new FormData();
    formData.set("email", targetEmail);
    const result = await requestCitizenOtpAction(undefined, formData);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setInfo(null);
      return false;
    }

    setNeedsProfile(
      Boolean(result && "needsProfile" in result && result.needsProfile),
    );
    setDevCode(result && "devCode" in result ? result.devCode : undefined);
    setResendIn(30);
    return true;
  }

  async function requestCode(formData: FormData) {
    setError(null);
    setInfo(null);
    setPending(true);
    const nextEmail = String(formData.get("email") ?? "")
      .toLowerCase()
      .trim();
    const ok = await sendCode(nextEmail);
    setPending(false);
    if (!ok) return;
    setEmail(nextEmail);
    setStep("code");
  }

  async function resendCode() {
    if (resendIn > 0 || pending) return;
    setError(null);
    setInfo(null);
    setPending(true);
    const ok = await sendCode(email);
    setPending(false);
    if (ok) {
      setInfo("A new code was sent. Use the latest email.");
    }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("email", email);

    try {
      const verified = await verifyCitizenOtpAction(undefined, formData);
      if (verified && "error" in verified && verified.error) {
        if ("needsProfile" in verified && verified.needsProfile) {
          setNeedsProfile(true);
        }
        setError(verified.error);
        setPending(false);
        return;
      }

      if (!verified || !("proof" in verified) || !verified.proof) {
        setError("Could not verify the code. Please try again.");
        setPending(false);
        return;
      }

      const result = await signIn("citizen-otp", {
        email: verified.email,
        proof: verified.proof,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (!result || result.error) {
        setError(
          "Code was accepted, but creating the session failed. Request a new code and try once more.",
        );
        setPending(false);
        return;
      }

      await redirectAfterSignIn(router, "/dashboard");
    } catch {
      setError("Could not verify the code. Please try again.");
      setPending(false);
    }
  }

  if (step === "email") {
    return (
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void requestCode(new FormData(event.currentTarget));
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            required
          />
        </div>
        <FormErrorBanner message={error} />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? "Sending code…" : "Email me a sign-in code"}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm font-medium text-accent hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={onUsePassword}
        >
          Sign in with password instead
        </button>
        <p className="text-center text-sm text-ink-muted">
          New student?{" "}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={verifyCode} className="space-y-5" noValidate>
      <p className="rounded-2xl bg-accent-soft/70 px-3.5 py-3 text-sm text-ink-muted">
        We sent a 6-digit code to{" "}
        <span className="font-semibold text-ink">{email}</span>. Use the
        latest email if you requested more than once.
        {devCode ? (
          <>
            {" "}
            <span className="font-semibold text-accent">Dev code: {devCode}</span>
          </>
        ) : null}
      </p>

      {needsProfile ? (
        <>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
          <div>
            <Label htmlFor="phone">Mobile</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="10-digit number"
              required
              pattern="[0-9]{10}"
              maxLength={10}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="mt-1.5 text-xs text-ink-muted">
              Use this password next time so you do not need a code every visit.
            </p>
          </div>
        </>
      ) : (
        <div>
          <Label htmlFor="password">Set a password (optional)</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            If you do not have a password yet, set one here to skip codes next
            time.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="code">Sign-in code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="6-digit code"
          required
          pattern="\d{6}"
          maxLength={6}
        />
      </div>
      <FormErrorBanner message={error} />
      {info ? (
        <p
          role="status"
          className="rounded-xl bg-accent-soft/80 px-3 py-2 text-sm text-accent"
        >
          {info}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Verifying…" : "Verify and continue"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        disabled={pending || resendIn > 0}
        onClick={() => void resendCode()}
      >
        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
      </Button>
      <button
        type="button"
        className="w-full text-center text-sm font-medium text-ink-muted hover:text-ink hover:underline disabled:opacity-50"
        disabled={pending}
        onClick={() => {
          setStep("email");
          setError(null);
          setInfo(null);
          setDevCode(undefined);
          setNeedsProfile(false);
          setResendIn(0);
        }}
      >
        Use a different email
      </button>
    </form>
  );
}
