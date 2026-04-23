"use client";

import Image from "next/image";
import { useState } from "react";
import { shouldUnoptimizeAvatarUrl } from "@/lib/avatar-cdn";

export function ReviewerAvatar({
  src,
  label,
}: {
  src: string | null;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (label.trim().slice(0, 1) || "?").toUpperCase();
  const showImg = Boolean(src?.trim()) && !failed;

  const href = src?.trim() ?? "";
  const unoptimized = shouldUnoptimizeAvatarUrl(href);

  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-200 ring-1 ring-[color:var(--color-line)]">
      {showImg ? (
        <Image
          src={href}
          alt=""
          fill
          className="object-cover"
          sizes="44px"
          unoptimized={unoptimized}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink/60">
          {initial}
        </span>
      )}
    </div>
  );
}
