"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useTurnstileWidget } from "@/lib/turnstile-client";

type Status = "idle" | "loading" | "success" | "error";

export function WholesaleBriefForm({ siteKey }: { siteKey: string }) {
  const t = useTranslations("WholesaleForm");
  const [company, setCompany] = useState("");
  const [targetRegion, setTargetRegion] = useState("");
  const [estimatedQty, setEstimatedQty] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [, setMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    canRender: canRenderTurnstile,
    widgetContainerRef,
    turnstileToken,
    turnstileScriptError,
    resetWidget,
  } = useTurnstileWidget(siteKey);

  useEffect(() => {
    if (!showSuccessModal) return;
    const timer = window.setTimeout(() => setShowSuccessModal(false), 6000);
    return () => window.clearTimeout(timer);
  }, [showSuccessModal]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    if (!turnstileToken) {
      setStatus("error");
      setMessage(t("errVerifyRequired"));
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/wholesale/mockup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          targetRegion,
          estimatedQty,
          email,
          notes,
          website,
          turnstileToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("success");
        setShowSuccessModal(true);
        setCompany("");
        setTargetRegion("");
        setEstimatedQty("");
        setEmail("");
        setNotes("");
        setWebsite("");
        resetWidget();
        return;
      }
      setStatus("error");
      setMessage(data.error ?? t("errSubmitGeneric"));
      resetWidget();
    } catch {
      setStatus("error");
      setMessage(t("errNetwork"));
      resetWidget();
    }
  }

  return (
    <>
      <form
        id="wholesale-brief-form"
        className="mt-6 grid gap-3 sm:grid-cols-2"
        onSubmit={onSubmit}
        noValidate
      >
        <label className="sm:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("labelCompany")}
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
            {t("labelRegion")}
          </span>
          <input
            value={targetRegion}
            onChange={(e) => setTargetRegion(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
          />
        </label>
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("labelQty")}
          </span>
          <input
            value={estimatedQty}
            onChange={(e) => setEstimatedQty(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("labelEmail")}
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
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("labelNotes")}
          </span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
            placeholder={t("notesPlaceholder")}
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
          <div ref={widgetContainerRef} className="min-h-[65px]" />
          {!canRenderTurnstile ? (
            <p className="mt-2 text-xs text-red-600/90">{t("verifyUnavailable")}</p>
          ) : null}
          {turnstileScriptError ? (
            <p className="mt-2 text-xs text-red-600/90">{t("errScriptLoad")}</p>
          ) : null}
          {canRenderTurnstile && !turnstileToken && !turnstileScriptError ? (
            <p className="mt-2 text-xs text-muted">{t("verifyHint")}</p>
          ) : null}
        </div>
        <div className="sm:col-span-2" />
      </form>

      {showSuccessModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wholesale-success-title"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-paper p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {t("successKicker")}
            </p>
            <h3 id="wholesale-success-title" className="mt-3 font-serif text-2xl text-ink">
              {t("successTitle")}
            </h3>
            <p className="mt-3 text-sm text-muted">{t("successBody")}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}