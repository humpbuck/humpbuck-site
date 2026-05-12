"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export function WholesaleBriefForm({ siteKey }: { siteKey: string }) {
  const [company, setCompany] = useState("");
  const [targetRegion, setTargetRegion] = useState("");
  const [estimatedQty, setEstimatedQty] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileScriptLoaded, setTurnstileScriptLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const canRenderTurnstile = Boolean(siteKey);

  useEffect(() => {
    if (!canRenderTurnstile || !turnstileScriptLoaded || !widgetRef.current || !window.turnstile) return;
    if (widgetId) return;
    const rendered = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
    setWidgetId(rendered);
  }, [canRenderTurnstile, siteKey, turnstileScriptLoaded, widgetId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    if (!turnstileToken) {
      setStatus("error");
      setMessage("Please complete the verification check.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/wholesale/mockup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, targetRegion, estimatedQty, email, notes, website, turnstileToken }),
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
        setWebsite("");
        setTurnstileToken("");
        if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
        return;
      }
      setStatus("error");
      setMessage(data.error ?? "Failed to submit. Please try again.");
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
      setTurnstileToken("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
      setTurnstileToken("");
    }
  }

  return (
    <>
      {canRenderTurnstile ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileScriptLoaded(true)}
          onError={() => setMessage("Verification script failed to load. Please refresh and try again.")}
        />
      ) : null}
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
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-[-9999px] top-auto h-px w-px opacity-0"
          aria-hidden="true"
        />
        <div className="sm:col-span-2">
          <div ref={widgetRef} className="min-h-[65px]" />
          {!canRenderTurnstile ? (
            <p className="mt-2 text-xs text-red-600/90">Verification is unavailable right now.</p>
          ) : null}
          {canRenderTurnstile && !turnstileToken ? (
            <p className="mt-2 text-xs text-muted">Please complete the verification before submitting.</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          {message ? (
            <p className={`text-xs ${status === "success" ? "text-ink/80" : "text-red-600/90"}`}>{message}</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted">Use the Email mockup request button on the right to submit after verification.</p>
        </div>
      </form>
    </>
  );
}
