import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/features/auth/auth";
import { prisma } from "@/shared/db/prisma";
import { OfficialComplaintActions } from "@/features/official/components/complaint-actions";
import { StatusBadge } from "@/features/complaints/components/status-badge";
import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/features/complaints/labels";
import { PRIORITY_LABELS } from "@/features/official/workflow";

type Params = Promise<{ id: string }>;

export default async function OfficialComplaintDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== "official" && session.user.role !== "admin")
  ) {
    redirect("/login");
  }

  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      citizen: { select: { name: true, email: true, phone: true } },
      photos: true,
      events: {
        include: { actor: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!complaint) notFound();

  return (
    <div className="rise-in mx-auto max-w-3xl space-y-6">
      <Link
        href="/queue"
        className="text-sm font-medium text-accent hover:underline"
      >
        ← Back to queue
      </Link>

      <div className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-accent">
              {complaint.publicRef}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              {complaint.title}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {COMPLAINT_TYPE_LABELS[complaint.type]} ·{" "}
              {PRIORITY_LABELS[complaint.priority]} priority · Filed{" "}
              {complaint.createdAt.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Student: {complaint.citizen.name}
              {complaint.citizen.phone ? ` · ${complaint.citizen.phone}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={complaint.status} />
            <a
              href={`/api/official/complaints/${complaint.id}/pdf`}
              className="text-sm font-medium text-accent hover:underline"
            >
              Download PDF
            </a>
          </div>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-ink">
          {complaint.description}
        </p>

        {complaint.addressText || complaint.floor ? (
          <p className="mt-4 text-sm text-ink-muted">
            <span className="font-semibold text-ink">Campus location:</span>{" "}
            {complaint.addressText}
            {complaint.floor ? ` · Floor ${complaint.floor}` : ""}
          </p>
        ) : null}

        {complaint.photos.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {complaint.photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-2xl border border-line/80 bg-white"
              >
                <Image
                  src={photo.url}
                  alt="Complaint photo"
                  fill
                  className="object-cover"
                  unoptimized={photo.url.startsWith("/")}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Workbench</h2>
        <div className="mt-5">
          <OfficialComplaintActions
            complaintId={complaint.id}
            status={complaint.status}
            priority={complaint.priority}
          />
        </div>
      </section>

      <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Timeline</h2>
        <ol className="mt-5 space-y-4">
          {complaint.events.map((event) => (
            <li key={event.id} className="border-l-2 border-accent/30 pl-4">
              <p className="text-sm font-semibold text-ink">
                {COMPLAINT_STATUS_LABELS[event.toStatus]}
              </p>
              <p className="text-xs text-ink-muted">
                {event.createdAt.toLocaleString()} · {event.actor.name} (
                {event.actor.role})
              </p>
              {event.note ? (
                <p className="mt-1 text-sm text-ink-muted">{event.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
