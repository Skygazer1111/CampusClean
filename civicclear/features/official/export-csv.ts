import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/features/complaints/labels";
import { PRIORITY_LABELS } from "@/features/official/workflow";
import {
  buildComplaintWhere,
  type QueueFilters,
} from "@/features/official/queue";
import { prisma } from "@/shared/db/prisma";

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

export async function buildComplaintsCsv(filters: QueueFilters) {
  const complaints = await prisma.complaint.findMany({
    where: buildComplaintWhere(filters),
    include: {
      citizen: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "publicRef",
    "title",
    "type",
    "status",
    "priority",
    "studentName",
    "studentEmail",
    "campusLocation",
    "floor",
    "createdAt",
    "resolvedAt",
  ];

  const rows = complaints.map((c) =>
    [
      c.publicRef,
      c.title,
      COMPLAINT_TYPE_LABELS[c.type],
      COMPLAINT_STATUS_LABELS[c.status],
      PRIORITY_LABELS[c.priority],
      c.citizen.name,
      c.citizen.email,
      c.addressText ?? "",
      c.floor ? `Floor ${c.floor}` : "",
      c.createdAt.toISOString(),
      c.resolvedAt?.toISOString() ?? "",
    ]
      .map(csvEscape)
      .join(","),
  );

  return [header.join(","), ...rows].join("\r\n");
}
