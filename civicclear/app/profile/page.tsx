import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/auth";
import { formatRewardLine } from "@/features/rewards/service";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { EmptyState } from "@/shared/ui/empty-state";
import { prisma } from "@/shared/db/prisma";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      rewards: {
        include: { complaint: { select: { publicRef: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="rise-in mx-auto max-w-xl space-y-6 sm:space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="hidden text-sm font-medium text-accent hover:underline md:inline"
        >
          ← Back to dashboard
        </Link>
        <p className="page-kicker md:mt-5">Student</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold tracking-tight sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-sm text-ink-muted sm:text-base">
          Update your contact details. Points are earned when reports are
          verified.
        </p>
      </div>

      <section className="glass-panel stat-tile rounded-[1.5rem] p-5 sm:rounded-[1.75rem] sm:p-8">
        <p className="text-sm font-medium text-ink-muted">Reward points</p>
        <p className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {user.points}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          +10 when an official verifies a report. +5 when it is resolved.
          Rejected reports earn nothing.
        </p>
      </section>

      <section className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Points history</h2>
        {user.rewards.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No points yet"
              description="Submit a valid report. Points appear after an official verifies it."
            />
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line/70">
            {user.rewards.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">
                    {formatRewardLine(entry)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {entry.createdAt.toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="mb-5 font-display text-xl font-semibold">Account</h2>
        <ProfileForm
          name={user.name}
          phone={user.phone ?? ""}
          email={user.email}
          hasPassword={Boolean(user.passwordHash)}
        />
      </div>
    </div>
  );
}
