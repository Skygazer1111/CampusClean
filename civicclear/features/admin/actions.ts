"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/features/auth/auth";
import {
  createOfficialSchema,
  createStudentSchema,
  deleteManagedUserSchema,
} from "@/features/auth/schemas";
import { prisma } from "@/shared/db/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function createOfficialAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = createOfficialSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const { getAdminEmail } = await import("@/features/auth/ensure-admin");
  if (getAdminEmail() && email === getAdminEmail()) {
    return { error: "That email is reserved for the admin account." };
  }

  let existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.active && existing.role !== "admin") {
    await prisma.user.delete({ where: { id: existing.id } });
    existing = null;
  }
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  await prisma.user.create({
    data: {
      name: "Coordinator",
      email,
      role: "official",
      active: true,
      passwordHash: null,
    },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function createStudentAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = createStudentSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  let existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.active && existing.role !== "admin") {
    await prisma.user.delete({ where: { id: existing.id } });
    existing = null;
  }
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      passwordHash: await hash(parsed.data.password, 12),
      role: "citizen",
    },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function deleteManagedUserAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData,
) {
  const session = await requireAdmin();
  if (!session) return { error: "Admin access required." };

  const parsed = deleteManagedUserSchema.safeParse({
    userId: formData.get("userId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true },
  });
  if (!target) return { error: "Account not found." };
  if (target.role === "admin") {
    return { error: "Admin accounts cannot be removed here." };
  }
  if (target.id === session.user.id) {
    return { error: "You cannot remove your own account." };
  }

  await prisma.user.delete({
    where: { id: target.id },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}
