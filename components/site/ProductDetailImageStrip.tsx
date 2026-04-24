"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Drops failed loads so remaining detail rows move up; no empty broken slots. */
export function ProductDetailImageStrip({
  productName,
  imageUrls,
}: {
  productName: string;
  imageUrls: string[];
}) {
  const [loadFailed, setLoadFailed] = useState<Set<string>>(() => new Set());
  const key = useMemo(() => imageUrls.join("\0"), [imageUrls]);

  useEffect(() => {
    setLoadFailed(new Set());
  }, [key]);

  const markFailed = useCallback((src: string) => {
    setLoadFailed((prev) => {
      if (prev.has(src)) return prev;
      const n = new Set(prev);
      n.add(src);
      return n;
    });
  }, []);

  const visible = useMemo(
    () => imageUrls.filter((s) => !loadFailed.has(s)),
    [imageUrls, loadFailed],
  );

  if (imageUrls.length === 0) return null;
  if (visible.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted" role="status">
        Detail images could not be loaded.
      </p>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-6">
      {visible.map((src, i) => (
        <div
          key={src}
          className="relative overflow-hidden rounded-2xl border border-[color:var(--color-line)] bg-paper shadow-sm"
        >
          <Image
            src={src}
            alt={`${productName} — detail ${i + 1}`}
            width={1200}
            height={1600}
            className="h-auto w-full object-cover"
            sizes="(max-width:1024px) 100vw, 896px"
            onError={() => markFailed(src)}
          />
        </div>
      ))}
    </div>
  );
}
