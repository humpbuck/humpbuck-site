"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Preset grid thumb — shows a placeholder if the remote URL fails
 * (DiceBear rate limits / network; R2 404; Next `remotePatterns` hostname mismatch).
 */
export function PresetAvatarImage({
  src,
  sizes,
  className = "object-cover",
}: {
  src: string;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center bg-zinc-200 text-[9px] font-medium text-zinc-400"
        title="Failed to load"
        aria-hidden
      >
        ···
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      className={className}
      sizes={sizes}
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
