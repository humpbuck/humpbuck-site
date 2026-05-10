"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AdminFlashMessage({
  kind,
  message,
  clearHref,
}: {
  kind: "success" | "error";
  message: string;
  clearHref?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!clearHref) return;
    const timer = window.setTimeout(() => {
      router.replace(clearHref);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [clearHref, router]);

  const style =
    kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${style}`}>
      {message}
    </p>
  );
}
