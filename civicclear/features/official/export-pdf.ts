import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/features/complaints/labels";
import { PRIORITY_LABELS } from "@/features/official/workflow";
import { prisma } from "@/shared/db/prisma";

async function loadImageBytes(url: string) {
  if (url.startsWith("/")) {
    const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    return readFile(filePath);
  }
  const res = await fetch(url);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

export async function buildComplaintPdf(complaintId: string) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      citizen: { select: { name: true, email: true, phone: true } },
      photos: true,
      events: {
        include: { actor: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!complaint) return null;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  const margin = 48;
  let y = 842 - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([595, 842]);
      y = 842 - margin;
    }
  };

  const write = (
    text: string,
    size: number,
    options?: { bold?: boolean; color?: ReturnType<typeof rgb> },
  ) => {
    const useFont = options?.bold ? bold : font;
    const maxWidth = 595 - margin * 2;
    const words = text.split(/\s+/);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (useFont.widthOfTextAtSize(next, size) > maxWidth) {
        ensureSpace(size + 6);
        page.drawText(line, {
          x: margin,
          y,
          size,
          font: useFont,
          color: options?.color ?? rgb(0.1, 0.12, 0.14),
        });
        y -= size + 6;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) {
      ensureSpace(size + 6);
      page.drawText(line, {
        x: margin,
        y,
        size,
        font: useFont,
        color: options?.color ?? rgb(0.1, 0.12, 0.14),
      });
      y -= size + 6;
    }
  };

  write("CampusClean campus report", 11, {
    color: rgb(0.35, 0.4, 0.38),
  });
  y -= 4;
  write(complaint.publicRef, 18, { bold: true });
  write(complaint.title, 14, { bold: true });
  y -= 6;
  write(
    `${COMPLAINT_TYPE_LABELS[complaint.type]} · ${PRIORITY_LABELS[complaint.priority]} · ${COMPLAINT_STATUS_LABELS[complaint.status]}`,
    11,
  );
  write(`Filed: ${complaint.createdAt.toISOString()}`, 10);
  write(
    `Student: ${complaint.citizen.name} <${complaint.citizen.email}>${
      complaint.citizen.phone ? ` · ${complaint.citizen.phone}` : ""
    }`,
    10,
  );
  if (complaint.addressText || complaint.floor) {
    write(
      `Campus location: ${complaint.addressText ?? "Not specified"}${
        complaint.floor ? ` · Floor ${complaint.floor}` : ""
      }`,
      10,
    );
  }
  y -= 8;
  write("Description", 12, { bold: true });
  write(complaint.description, 11);
  y -= 10;

  write("Timeline", 12, { bold: true });
  if (complaint.events.length === 0) {
    write("No status events recorded.", 10);
  } else {
    for (const event of complaint.events) {
      write(
        `${event.createdAt.toISOString()} — ${COMPLAINT_STATUS_LABELS[event.toStatus]} — ${event.actor.name} (${event.actor.role})`,
        10,
      );
      if (event.note) write(`Note: ${event.note}`, 10);
    }
  }

  if (complaint.photos.length > 0) {
    y -= 10;
    write("Photos", 12, { bold: true });
    for (const photo of complaint.photos) {
      try {
        const bytes = await loadImageBytes(photo.url);
        if (!bytes) {
          write(`Photo unavailable: ${photo.url}`, 9);
          continue;
        }
        const isPng = photo.url.toLowerCase().includes(".png");
        const image = isPng
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const maxW = 595 - margin * 2;
        const maxH = 220;
        const scale = Math.min(maxW / image.width, maxH / image.height, 1);
        const w = image.width * scale;
        const h = image.height * scale;
        ensureSpace(h + 16);
        page.drawImage(image, { x: margin, y: y - h, width: w, height: h });
        y -= h + 12;
      } catch {
        write(`Photo could not be embedded: ${photo.url}`, 9);
      }
    }
  }

  return {
    bytes: await doc.save(),
    filename: `${complaint.publicRef}.pdf`,
  };
}
