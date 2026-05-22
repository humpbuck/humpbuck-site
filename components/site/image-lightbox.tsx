"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { StorefrontImage } from "@/components/site/storefront-image";

/**
 * Full-viewport image overlay: click image or backdrop to close.
 * Portaled above modals (z-[120]) so parent dialogs stay open.
 */
export function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex cursor-zoom-out items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div className="relative h-[min(92vh,1200px)] w-[min(96vw,1200px)]">
        <StorefrontImage
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="96vw"
          priority
        />
      </div>
    </div>,
    document.body,
  );
}
