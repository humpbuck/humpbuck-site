"use client";

import { useFormStatus } from "react-dom";

export function ReadActionButton({
  idleLabel,
  pendingLabel,
}: {
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest transition ${
        pending
          ? "cursor-not-allowed border-ink/30 bg-ink/10 text-ink/60"
          : "border-line bg-white text-ink hover:border-ink/20 active:scale-[0.98]"
      }`}
      aria-busy={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
