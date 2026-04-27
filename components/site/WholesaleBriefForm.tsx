"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function WholesaleBriefForm() {
  const [company, setCompany] = useState("");
  const [targetRegion, setTargetRegion] = useState("");
  const [estimatedQty, setEstimatedQty] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/wholesale/mockup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, targetRegion, estimatedQty, email, notes }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("success");
        setMessage("Request submitted. We have sent your details to support for review.");
        setCompany("");
        setTargetRegion("");
        setEstimatedQty("");
        setEmail("");
        setNotes("");
        return;
      }
      setStatus("error");
      setMessage(data.error ?? "Failed to submit. Please try again.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      id="wholesale-brief-form"
      className="mt-6 grid gap-3 sm:grid-cols-2"
      onSubmit={onSubmit}
      noValidate
    >
      <label className="sm:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Company / project name
        </span>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
        />
      </label>
      <label>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Target region
        </span>
        <input
          value={targetRegion}
          onChange={(e) => setTargetRegion(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
        />
      </label>
      <label>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Estimated qty
        </span>
        <input
          value={estimatedQty}
          onChange={(e) => setEstimatedQty(e.target.value)}
          className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
        />
      </label>
      <label className="sm:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Notes</span>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
          placeholder="Materials, references, deadline..."
        />
      </label>
      <div className="sm:col-span-2">
        {message ? (
          <p className={`text-xs ${status === "success" ? "text-ink/80" : "text-red-600/90"}`}>{message}</p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </form>
  );
}
