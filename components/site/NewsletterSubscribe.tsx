"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        already?: boolean;
      };

      if (res.ok && data.ok) {
        setStatus("success");
        setMessage(
          data.already
            ? "You’re already on the list — thanks for checking in."
            : "Thanks — you’re subscribed.",
        );
        setEmail("");
        return;
      }

      setStatus("error");
      setMessage(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={onSubmit}
      noValidate
    >
      <div className="flex w-full flex-col gap-2 sm:flex-1">
        <label className="sr-only" htmlFor="newsletter-email">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          disabled={status === "loading"}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "success" || status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          className="w-full rounded-2xl border border-[color:var(--color-line)] bg-paper px-4 py-3 text-sm outline-none ring-0 placeholder:text-muted focus:border-ink/25 disabled:opacity-60"
        />
        {message ? (
          <p
            className={`text-xs ${
              status === "success" ? "text-ink/80" : "text-red-600/90"
            }`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="shrink-0 rounded-2xl bg-ink px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90 disabled:opacity-60 sm:mt-0"
      >
        {status === "loading" ? "…" : "Subscribe"}
      </button>
    </form>
  );
}
