"use client";

import Image from "next/image";
import { useState } from "react";
import { shouldUnoptimizeAvatarUrl } from "@/lib/avatar-cdn";

export function HeaderUserAvatar({
  src,
  label,
  size = 28,
}: {
  src?: string | null;
  label: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = label.trim().slice(0, 1).toUpperCase() || "?";
  const show = Boolean(src?.trim()) && !failed;

  if (show) {
    return (
      <span
        className="relative inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-[color:var(--color-line)]"
        style={{ width: size, height: size }}
      >
        <Image
          src={src!.trim()}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized={shouldUnoptimizeAvatarUrl(src)}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold tabular-nums text-ink/60 ring-1 ring-[color:var(--color-line)]"
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}
