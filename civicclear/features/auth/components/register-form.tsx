"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  registerCitizenWithOtpAction,
  verifyCitizenOtpAction,
} from "@/features/auth/actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { FormErrorBanner } from "@/shared/ui/field-error";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code">("details");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [devCode, setDevCode] = useState<string | undefined>();
  const [otpCode, setOtpCode] = useState("");

  async function onDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await registerCitizenWithOtpAction(undefined, formData);
    setPending(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setEmail(String(formData.get("email") ?? "").toLowerCase().trim());
    setName(String(formData.get("name") ?? ""));
    setPhone(String(formData.get("phone") ?? ""));
    setPassword(String(formData.get("password") ?? ""));
    setDevCode(result && "devCode" in result ? result.devCode : undefined);
    setOtpCode("");
    setStep("code");
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    formData.set("code", otpCode);
    formData.set("email", email);
    formData.set("name", name);
    formData.set("phone", phone);
    formData.set("password", password);

    try {
      const verified = await verifyCitizenOtpAction(undefined, formData);
      if (verified && "error" in verified && verified.error) {
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
          "Account ready, but sign-in failed. Try signing in with your password.",
        );
        setPending(false);
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not finish registration. Please try again.");
      setPending(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={onVerify} className="space-y-5" noValidate>
        <p className="rounded-2xl bg-accent-soft/70 px-3.5 py-3 text-sm text-ink-muted">
          Enter the code sent to{" "}
          <span className="font-semibold text-ink">{email}</span> to verify
          your email. After that you can sign in with your password.
          {devCode ? (
            <>
              {" "}
              <span className="font-semibold text-accent">Dev code: {devCode}</span>
            </>
          ) : null}
        </p>
        <div>
          <Label htmlFor="otp-code">Email verification code</Label>
          <Input
            id="otp-code"
            name="otpCode"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="6-digit code"
            value={otpCode}
            onChange={(event) =>
              setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
            pattern="\d{6}"
            maxLength={6}
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
          {pending ? "Verifying…" : "Verify and create account"}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm font-medium text-accent hover:underline"
          disabled={pending}
          onClick={() => {
            setStep("details");
            setError(null);
            setDevCode(undefined);
            setOtpCode("");
          }}
        >
          Edit details
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onDetails} className="space-y-5" noValidate>
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
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
          At least 8 characters. You will use this to sign in after email
          verification.
        </p>
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
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Sending code…" : "Continue — verify email"}
      </Button>
      <p className="text-center text-sm text-ink-muted">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
