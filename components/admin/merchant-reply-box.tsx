"use client";

import { useState } from "react";

type Props = {
  reviewId: string;
  initialReply: string | null;
  initialAt: string | null;
};

export function MerchantReplyBox({
  reviewId,
  initialReply,
  initialAt,
}: Props) {
  const [editing, setEditing] = useState(!initialReply);
  const [text, setText] = useState(initialReply ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!initialReply);
  const [displayAt, setDisplayAt] = useState(initialAt);
  const [displayReply, setDisplayReply] = useState(initialReply);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const t = text.trim();
    if (!t) {
      setErr("Reply text is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantReply: t }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Save failed");
      setDisplayReply(t);
      setDisplayAt(new Date().toISOString());
      setSaved(true);
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (saved && displayReply && !editing) {
    return (
      <div className="max-w-xs">
        <p className="line-clamp-3 whitespace-pre-wrap text-ink/90">{displayReply}</p>
        {displayAt ? (
          <p className="mt-1 text-[10px] text-muted">
            {new Date(displayAt).toLocaleString("en-US", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setText(displayReply);
            setEditing(true);
          }}
          className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/70 hover:text-ink"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="max-w-[min(280px,40vw)] space-y-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={5_000}
        placeholder="Public reply to buyer…"
        className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-xs text-ink"
      />
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-paper"
      >
        {saving ? "…" : "Save reply"}
      </button>
    </form>
  );
}
