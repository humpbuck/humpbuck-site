"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { HeaderUserAvatar } from "@/components/site/HeaderUserAvatar";

export function AccountMenu({
  userEmail,
  userImage,
  userName,
}: {
  userEmail?: string | null;
  userImage?: string | null;
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const avatarLabel =
    userName?.trim() ||
    userEmail?.split("@")[0]?.trim() ||
    "Account";

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex max-w-[220px] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 transition hover:bg-ink/[0.04] hover:text-ink"
      >
        <HeaderUserAvatar src={userImage} label={avatarLabel} size={30} />
        <span className="truncate" title={userEmail ?? undefined}>
          My account
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-line bg-paper/95 py-2 shadow-card backdrop-blur-md"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[12px] font-medium text-ink/90 transition hover:bg-ink/[0.04]"
          >
            Overview
          </Link>
          {userEmail && (
            <p className="border-t border-line px-4 py-2 text-[10px] uppercase tracking-widest text-muted">
              {userEmail}
            </p>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
            className="w-full border-t border-line px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-widest text-ink/80 transition hover:bg-ink/[0.04]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
