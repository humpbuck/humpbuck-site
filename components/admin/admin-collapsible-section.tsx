"use client";

import { ChevronDown } from "lucide-react";

export function AdminCollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-2xl border border-line bg-white/60 open:bg-white/75"
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
          {title}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className="shrink-0 text-muted transition duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t border-line px-5 pb-5 pt-4">{children}</div>
    </details>
  );
}
