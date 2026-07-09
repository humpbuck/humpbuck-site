"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

let scrollLockCount = 0;
let scrollLockPrevOverflow = "";

function lockDocumentScroll() {
  if (scrollLockCount === 0) {
    scrollLockPrevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

function unlockDocumentScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = scrollLockPrevOverflow;
    scrollLockPrevOverflow = "";
  }
}

/**
 * Centered dialog: backdrop click closes, top-right close control, Escape closes.
 * Use for site-wide modal patterns (same behavior as expectations for overlays).
 */
export function CenterModal({
  title,
  accessibleTitle,
  onClose,
  children,
  size = "default",
  layer = "default",
}: {
  title: string;
  /** Screen-reader title when `title` is visually hidden. */
  accessibleTitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** `wide` for landscape forms (e.g. contact). */
  size?: "default" | "wide";
  /** Stack above another open modal (e.g. nested dialogs). */
  layer?: "default" | "elevated";
}) {
  const titleId = useId();
  const visibleTitle = title.trim();
  const a11yTitle = accessibleTitle?.trim() || visibleTitle || "Dialog";

  useEffect(() => {
    lockDocumentScroll();
    return () => {
      unlockDocumentScroll();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 ${
        layer === "elevated" ? "!z-[110]" : ""
      }`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-paper p-6 shadow-xl ${
          size === "wide" ? "max-w-3xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {visibleTitle ? (
          <div className="flex items-start justify-between gap-3">
            <h2
              id={titleId}
              className="pr-2 font-serif text-xl tracking-tight text-ink"
            >
              {visibleTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-ink/70 transition hover:bg-ink/[0.06]"
              aria-label="Close"
            >
              <X size={22} strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="sr-only">
              {a11yTitle}
            </h2>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-2 text-ink/70 transition hover:bg-ink/[0.06]"
                aria-label="Close"
              >
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>
          </>
        )}
        <div className={visibleTitle ? "mt-4" : "mt-0"}>{children}</div>
      </div>
    </div>
  );
}
