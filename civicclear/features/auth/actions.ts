"use server";

import { hash } from "bcryptjs";
import { signOut } from "@/features/auth/auth";
import {
  citizenEmailSchema,
  citizenOtpVerifySchema,
  registerCitizenSchema,
  staffSetupSchema,
} from "@/features/auth/schemas";
import {
  createCitizenLoginProof,
  generateOtpCode,
  hashOtpCode,
  normalizeOtpInput,
  otpExpiresAt,
} from "@/features/auth/otp";
import { sendCitizenOtpEmail } from "@/shared/lib/mail";
import { prisma } from "@/shared/db/prisma";

async function persistAndSendOtp(email: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.loginOtp.count({
    where: { email, createdAt: { gte: since } },
  });
  if (recentCount >= 8) {
    return { error: "Too many codes requested. Try again in an hour." };
  }

  const code = generateOtpCode();
  await prisma.loginOtp.deleteMany({ where: { email } });
  await prisma.loginOtp.create({
    data: {
      email,
      codeHash: hashOtpCode(code),
      expiresAt: otpExpiresAt(10),
    },
  });

  const sent = await sendCitizenOtpEmail(email, code);
  return {
    ok: true as const,
    devCode: sent.mode === "dev" ? code : undefined,
  };
}

async function issueCitizenOtp(email: string) {
  const normalized = email.toLowerCase().trim();

  let existingUser = await prisma.user.findUnique({
    where: { email: normalized },
  });
  if (existingUser && !existingUser.active) {
    await prisma.user.delete({ where: { id: existingUser.id } });
    existingUser = null;
  }
  if (existingUser && existingUser.role !== "citizen") {
    return {
      error:
        "This email belongs to a staff account. Sign in with this email to set up or use your password.",
    };
  }

  const issued = await persistAndSendOtp(normalized);
  if ("error" in issued) return issued;

  return {
    ...issued,
    needsProfile: !existingUser,
  };
}

export async function requestCitizenOtpAction(
  _prev: unknown,
  formData: FormData,
) {
  const parsed = citizenEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  try {
    return await issueCitizenOtp(parsed.data.email);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not send a sign-in code.",
    };
  }
}

export async function registerCitizenWithOtpAction(
  _prev: unknown,
  formData: FormData,
) {
  const parsed = registerCitizenSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  let existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.active) {
    await prisma.user.delete({ where: { id: existing.id } });
    existing = null;
  }
  if (existing) {
    return {
      error: "An account with this email already exists. Sign in with your password.",
    };
  }

  try {
    const issued = await issueCitizenOtp(email);
    if ("error" in issued && issued.error) return issued;
    return {
      ...issued,
      name: parsed.data.name,
      phone: parsed.data.phone,
      needsProfile: true as const,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not send a sign-in code.",
    };
  }
}

/**
 * Verify OTP in a server action (clear errors), then return a short-lived
 * proof the Auth.js provider can exchange for a session.
 */
export async function verifyCitizenOtpAction(
  _prev: unknown,
  formData: FormData,
) {
  const parsed = citizenOtpVerifySchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const code = normalizeOtpInput(parsed.data.code);

  const otp = await prisma.loginOtp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { error: "No active code for this email. Request a new one." };
  }
  if (otp.expiresAt.getTime() < Date.now()) {
    await prisma.loginOtp.deleteMany({ where: { email } });
    return { error: "That code has expired. Request a new one." };
  }
  if (otp.attempts >= 5) {
    return { error: "Too many incorrect attempts. Request a new code." };
  }

  const matches = otp.codeHash === hashOtpCode(code);
  if (!matches) {
    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: "That code is incorrect. Check the latest email and try again." };
  }

  const passwordHash = parsed.data.password
    ? await hash(parsed.data.password, 12)
    : null;

  let user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.active) {
    await prisma.user.delete({ where: { id: user.id } });
    user = null;
  }
  if (!user) {
    if (!parsed.data.name || !parsed.data.phone) {
      return {
        error: "New accounts need your name and 10-digit mobile number.",
        needsProfile: true as const,
      };
    }
    if (!passwordHash) {
      return {
        error: "New accounts need a password (at least 8 characters).",
      };
    }
    user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        role: "citizen",
        passwordHash,
      },
    });
  } else if (passwordHash && !user.passwordHash) {
    // Let OTP-only accounts set a password when signing in via code.
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }

  if (user.role !== "citizen") {
    return {
      error:
        "This email belongs to a staff account. Sign in with this email to set up or use your password.",
    };
  }

  // Only consume the OTP after the account is ready.
  await prisma.loginOtp.deleteMany({ where: { email } });

  return {
    ok: true as const,
    email,
    proof: createCitizenLoginProof(email),
  };
}

export async function beginStaffSetupAction(
  _prev: unknown,
  formData: FormData,
) {
  const parsed = citizenEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const { ensureAdminInvite, getAdminEmail } = await import(
    "@/features/auth/ensure-admin"
  );
  const adminEmail = getAdminEmail();

  try {
    if (adminEmail && email === adminEmail) {
      await ensureAdminInvite();
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { notStaff: true as const };
    if (!user.active) {
      await prisma.user.delete({ where: { id: user.id } });
      return { removedAccount: true as const };
    }
    if (user.role !== "admin" && user.role !== "official") {
      return { notStaff: true as const };
    }
    if (user.passwordHash) {
      return { needsPassword: true as const };
    }

    const issued = await persistAndSendOtp(email);
    if ("error" in issued) return issued;

    return {
      ...issued,
      role: user.role,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not start account setup.",
    };
  }
}

export async function completeStaffSetupAction(
  _prev: unknown,
  formData: FormData,
) {
  const parsed = staffSetupSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const code = normalizeOtpInput(parsed.data.code);

  const otp = await prisma.loginOtp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { error: "No active code for this email. Request a new one." };
  }
  if (otp.expiresAt.getTime() < Date.now()) {
    await prisma.loginOtp.deleteMany({ where: { email } });
    return { error: "That code has expired. Request a new one." };
  }
  if (otp.attempts >= 5) {
    return { error: "Too many incorrect attempts. Request a new code." };
  }

  const matches = otp.codeHash === hashOtpCode(code);
  if (!matches) {
    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return {
      error: "That code is incorrect. Check the latest email and try again.",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return { error: "Account not found." };
  }
  if (user.role !== "admin" && user.role !== "official") {
    return { error: "This setup link is for staff accounts only." };
  }
  if (user.passwordHash) {
    return { error: "This account already has a password. Sign in with it." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      passwordHash: await hash(parsed.data.password, 12),
    },
  });
  await prisma.loginOtp.deleteMany({ where: { email } });

  return { ok: true as const, email };
}

export async function logoutAction() {
  // Prefer client LogoutButton (next-auth/react). This remains for form fallbacks.
  await signOut({ redirectTo: "/" });
}
