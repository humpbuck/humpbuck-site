import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Back one level in admin (e.g. Reviews → Overview). */
export function AdminBackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted transition hover:text-ink"
    >
      <ArrowLeft size={16} strokeWidth={2} className="shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
