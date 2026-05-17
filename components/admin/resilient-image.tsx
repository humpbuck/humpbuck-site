"use client";

import { useMemo, useState } from "react";

export function ResilientImage({
  sources,
  alt,
  className,
}: {
  sources: string[];
  alt: string;
  className?: string;
}) {
  const cleaned = useMemo(
    () => Array.from(new Set(sources.map((x) => x.trim()).filter(Boolean))),
    [sources],
  );
  const [idx, setIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  if (!cleaned.length || allFailed) {
    return <div className={`${className ?? ""} bg-paper`} />;
  }

  return (
    // Intentional: multi-URL fallback on `onError`; `next/image` is single-src without a custom loader.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cleaned[idx]}
      alt={alt}
      className={className}
      onError={() => {
        setIdx((current) => {
          const next = current + 1;
          if (next < cleaned.length) return next;
          setAllFailed(true);
          return current;
        });
      }}
    />
  );
}
