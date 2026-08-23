import { redirect } from "next/navigation";
import { auth } from "@/features/auth/auth";
import { CreateOfficialForm } from "@/features/auth/components/create-official-form";
import { CreateStudentForm } from "@/features/admin/components/create-student-form";
import { ManagedUserList } from "@/features/admin/components/managed-user-list";
import { prisma } from "@/shared/db/prisma";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/login");
  }

  const [coordinators, students] = await Promise.all([
    prisma.user.findMany({
      where: { role: "official" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        passwordHash: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "citizen" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        passwordHash: true,
      },
    }),
  ]);

  return (
    <div className="rise-in mx-auto max-w-2xl space-y-8">
      <div>
        <p className="page-kicker">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          Accounts
        </h1>
        <p className="mt-2 text-ink-muted">
          Add and remove coordinators and students. Removed accounts cannot
          sign in.
        </p>
      </div>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Add coordinator</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Coordinators cannot self-register. Invite their email; they set a
          password and profile on first sign-in.
        </p>
        <div className="mt-5">
          <CreateOfficialForm />
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Coordinators</h2>
        <ManagedUserList
          users={coordinators.map(({ passwordHash, ...user }) => ({
            ...user,
            pendingSetup: !passwordHash,
          }))}
          emptyTitle="No coordinators yet"
          emptyDescription="Add one above to get started."
        />
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Add student</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Students can also create their own accounts from the register page.
        </p>
        <div className="mt-5">
          <CreateStudentForm />
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Students</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {students.length} {students.length === 1 ? "account" : "accounts"}
        </p>
        <ManagedUserList
          users={students.map(({ passwordHash, ...user }) => ({
            ...user,
            pendingSetup: !passwordHash,
          }))}
          emptyTitle="No students yet"
          emptyDescription="Add one above, or wait for a student to register."
        />
      </section>
    </div>
  );
}
