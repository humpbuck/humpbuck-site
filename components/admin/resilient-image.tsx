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

  if (!cleaned.length) {
    return <div className={`${className ?? ""} bg-paper`} />;
  }

  return (
    <img
      src={cleaned[idx]}
      alt={alt}
      className={className}
      onError={() => {
        setIdx((current) => (current + 1 < cleaned.length ? current + 1 : current));
      }}
    />
  );
}
