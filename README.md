<p align="center">
  <img src="civicclear/public/brand/campusclean-logo.png" alt="CampusClean logo" width="96" />
</p>

# CampusClean

CampusClean is a student-first issue reporting platform for SRMIST. It gives students a simple way to report campus problems with a photo, building, and floor, while coordinators get a focused queue to verify, track, and resolve those reports.

The product is built around a campus workflow: students notice an issue, submit evidence, coordinators verify it, and the student earns points only when the report is useful.

## What It Solves

Campus maintenance issues often get shared informally and then disappear in chats. CampusClean turns those reports into structured records with clear ownership, status history, and proof.

Students can report:

- Waterlogging
- Elevator issues
- Escalator issues
- Washroom issues
- Other campus problems

Reports use fixed campus locations instead of GPS, making the flow faster and more reliable indoors. Supported locations include TP1, TP2, UB, Architecture block, MBA block, Biotech block, Java Canteen, and Vendhar Square.

## User Roles

**Students** create their own accounts, verify email with OTP, submit reports, upload photos, choose building and floor, track status, and earn points for valid reports.

**Coordinators** are invited by the admin. On first login, they verify their email and set their own profile and password. They can review the report queue, verify reports, move work forward, resolve issues, export data, and download report PDFs.

**Admin** owns account management. The admin is recognized by the configured admin email, completes first-login setup through OTP, and can invite or delete coordinator/student accounts.

## Core Workflow

1. A student files a report with title, description, issue type, campus location, floor, and 1-3 photos.
2. The report appears in the coordinator queue.
3. A coordinator verifies, progresses, resolves, or rejects the report.
4. Status history is recorded as a timeline.
5. Reward points are awarded for verified and resolved reports.

## Technical Overview

CampusClean is a full-stack Next.js App Router application using server actions for mutations and Auth.js for role-aware authentication.

**Frontend**

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Recharts for coordinator analytics
- Responsive mobile-first UI with glassmorphic campus styling

**Backend**

- Auth.js credentials and OTP flows
- Prisma ORM
- PostgreSQL database
- Server actions for registration, login setup, reports, account management, and coordinator workflows
- PDF and CSV exports for operational reporting

**Infrastructure Integrations**

- Brevo for OTP email delivery
- Cloudinary or local upload fallback for report photos
- Vercel-ready deployment model

## Architecture

```text
civicclear/
  app/                 Route handlers, pages, layouts
  features/
    auth/              Login, OTP, first-login setup, role routing
    admin/             Account management actions and UI
    complaints/        Report creation, campus locations, photos, labels
    official/          Coordinator queue, analytics, workflow, exports
    profile/           Student profile and password management
    rewards/           Points ledger and reward rules
  shared/
    db/                Prisma client
    layout/            App shell, headers, footer, navigation
    lib/               Mail, uploads, utilities
    ui/                Reusable form and display primitives
  prisma/              Database schema and seed script
```

## Design Direction

The UI is designed for students first: fast actions, large tap targets, clean mobile screens, and an SRM campus-inspired landing page. The coordinator side is intentionally more operational, focused on queue clarity, status changes, analytics, and exports.

## Security And Data Handling

- Passwords are hashed with bcrypt.
- OTPs are stored as hashes with expiry and attempt limits.
- Staff setup requires email ownership before password creation.
- Admin password is not stored in environment variables.
- Removed accounts are deleted instead of restored.
- Report photos are stored through the configured upload backend.
