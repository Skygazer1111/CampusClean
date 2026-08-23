import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/features/auth/auth";
import { prisma } from "@/shared/db/prisma";
import { AutoRefresh } from "@/shared/layout/auto-refresh";
import { StatusBadge } from "@/features/complaints/components/status-badge";
import { Button } from "@/shared/ui/button";
import {
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/features/complaints/labels";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ created?: string }>;

export default async function ComplaintDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { created } = await searchParams;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      photos: true,
      events: {
        include: { actor: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!complaint || complaint.citizenId !== session.user.id) {
    notFound();
  }

  return (
    <div className="rise-in mx-auto max-w-3xl space-y-6">
      <AutoRefresh seconds={20} />
      <Link
        href="/dashboard"
        className="text-sm font-medium text-accent hover:underline"
      >
        ← Back to dashboard
      </Link>

      {created === "1" ? (
        <div className="glass-panel rounded-[1.5rem] border border-emerald-200/70 bg-emerald-50/70 p-5">
          <p className="text-sm font-semibold text-status-resolved">
            Report submitted
          </p>
          <p className="mt-1 text-ink">
            Your reference number is{" "}
            <span className="font-semibold">{complaint.publicRef}</span>. Keep it
            to track this issue.
          </p>
        </div>
      ) : null}

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
              {COMPLAINT_TYPE_LABELS[complaint.type]} · Filed{" "}
              {complaint.createdAt.toLocaleString()}
            </p>
          </div>
          <StatusBadge status={complaint.status} />
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
        <h2 className="font-display text-xl font-semibold">Timeline</h2>
        <ol className="mt-5 space-y-4">
          {complaint.events.map((event) => (
            <li
              key={event.id}
              className="border-l-2 border-accent/30 pl-4"
            >
              <p className="text-sm font-semibold text-ink">
                {COMPLAINT_STATUS_LABELS[event.toStatus]}
              </p>
              <p className="text-xs text-ink-muted">
                {event.createdAt.toLocaleString()} · {event.actor.name}
              </p>
              {event.note ? (
                <p className="mt-1 text-sm text-ink-muted">{event.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <Button asChild variant="outline">
        <Link href="/complaints/new">File another report</Link>
      </Button>
    </div>
  );
}
