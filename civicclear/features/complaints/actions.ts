"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/features/auth/auth";
import { createPublicRef } from "@/features/complaints/service";
import { assertComplaintRateLimit } from "@/features/complaints/rate-limit";
import { createComplaintSchema } from "@/features/complaints/schemas";
import { uploadComplaintPhotos } from "@/features/complaints/uploads";
import { prisma } from "@/shared/db/prisma";
import type { ComplaintType } from "@prisma/client";

export async function createComplaintAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "citizen") {
    return { error: "You must be signed in as a student." };
  }

  try {
    await assertComplaintRateLimit(session.user.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Rate limit exceeded",
    };
  }

  const parsed = createComplaintSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
    addressText: formData.get("addressText"),
    floor: formData.get("floor"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const files = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0);

  let photos;
  try {
    photos = await uploadComplaintPhotos(files);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Photo upload failed",
    };
  }

  const publicRef = await createPublicRef();

  const complaint = await prisma.complaint.create({
    data: {
      publicRef,
      citizenId: session.user.id,
      type: parsed.data.type as ComplaintType,
      title: parsed.data.title,
      description: parsed.data.description,
      lat: null,
      lng: null,
      addressText: parsed.data.addressText,
      floor: parsed.data.floor,
      status: "submitted",
      photos: {
        create: photos.map((photo) => ({
          url: photo.url,
          width: photo.width,
          height: photo.height,
        })),
      },
      events: {
        create: {
          actorId: session.user.id,
          fromStatus: null,
          toStatus: "submitted",
          note: "Report submitted",
        },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/queue");
  redirect(`/complaints/${complaint.id}?created=1`);
}
