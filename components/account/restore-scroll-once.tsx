"use client";

import { useEffect } from "react";

export function RestoreScrollOnce({
  enabled,
  storageKey,
}: {
  enabled: boolean;
  storageKey: string;
}) {
  useEffect(() => {
    if (!enabled) return;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;
    const y = Number(raw);
    if (!Number.isFinite(y)) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
      window.sessionStorage.removeItem(storageKey);
    });
  }, [enabled, storageKey]);

  return null;
}

