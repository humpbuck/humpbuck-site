"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";
import {
  useWhatsAppPageHref,
  WhatsAppConfirmDialog,
} from "@/components/site/whatsapp-confirm-dialog";

export function HomeCertaintySidebar({
  kicker,
  heading,
  lead,
  supportPrompt,
  supportCta,
}: {
  kicker: string;
  heading: string;
  lead: string;
  supportPrompt: string;
  supportCta: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const href = useWhatsAppPageHref();

  return (
    <>
      <div className="lg:sticky lg:top-24 lg:max-w-md">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          <HelpCircle size={14} strokeWidth={1.75} className="text-ink/35" aria-hidden />
          {kicker}
        </p>
        <h2
          id="home-certainty-heading"
          className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-[2.15rem] sm:leading-tight"
        >
          {heading}
        </h2>
        {lead ? (
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{lead}</p>
        ) : null}
        <p className="mt-4 text-sm leading-relaxed text-muted">{supportPrompt}</p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink/75 underline-offset-4 transition hover:text-ink hover:underline"
        >
          {supportCta}
          <span aria-hidden>→</span>
        </button>
      </div>

      <WhatsAppConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        href={href}
      />
    </>
  );
}
