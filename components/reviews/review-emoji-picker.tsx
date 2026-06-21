"use client";

import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const REVIEW_EMOJIS = [
  "😊",
  "😍",
  "🥰",
  "👍",
  "👏",
  "❤️",
  "🔥",
  "✨",
  "🎁",
  "💯",
  "😂",
  "🙏",
  "💎",
  "🌸",
  "☕",
  "🕯️",
] as const;

export function ReviewEmojiPicker({
  onPick,
  label,
  variant = "grid",
}: {
  onPick: (emoji: string) => void;
  label?: string;
  variant?: "grid" | "popover";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(emoji: string) {
    onPick(emoji);
    setOpen(false);
  }

  if (variant === "popover") {
    return (
      <div ref={rootRef} className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-muted/80 transition hover:bg-ink/[0.06] hover:text-ink"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label ?? "Add emoji"}
        >
          <Smile size={18} strokeWidth={1.75} aria-hidden />
        </button>
        {open ? (
          <div
            role="listbox"
            className="pointer-events-auto absolute bottom-full right-0 z-20 mb-1 grid w-46 grid-cols-4 gap-1 rounded-xl border border-line bg-paper p-2 shadow-card"
          >
            {REVIEW_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                role="option"
                onClick={() => pick(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-base transition hover:bg-ink/[0.06]"
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {label ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
      ) : null}
      <div className={`flex flex-wrap gap-1 ${label ? "mt-2" : ""}`}>
        {REVIEW_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-paper text-lg transition hover:border-ink/25 hover:bg-white"
            aria-label={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
