import Link from "next/link";

const YEAR = new Date().getFullYear();

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={`relative z-10 mt-auto border-t border-white/60 bg-white/35 backdrop-blur-md ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-5 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-7">
        <p className="tracking-tight">
          © {YEAR}{" "}
          <span className="font-semibold text-ink">CampusClean</span>. All rights
          reserved.
        </p>
        <p className="tracking-tight">
          Built By{" "}
          <a
            href="https://portfolio-priyan.vercel.app/"
            className="font-display text-base font-semibold text-accent transition-colors hover:text-accent-hover hover:underline"
          >
            Priyan
          </a>
        </p>
        <nav
          className="flex flex-wrap gap-x-5 gap-y-2"
          aria-label="Legal"
        >
          <Link
            href="/privacy"
            className="inline-flex min-h-10 items-center transition-colors hover:text-accent hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-10 items-center transition-colors hover:text-accent hover:underline"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
