"use client";

import dynamic from "next/dynamic";
import type { OemInquiryProductOption } from "@/components/site/oem-inquiry-form";
import { supportMailtoHref, SUPPORT_EMAIL } from "@/lib/support-email";
import { WHATSAPP_DISPLAY, whatsappHrefWithBody } from "@/lib/whatsapp";
import { Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const OemInquiryForm = dynamic(
  () =>
    import("@/components/site/oem-inquiry-form").then((m) => m.OemInquiryForm),
  { ssr: false },
);

export function OemOdmGetStartedSection({
  products,
  whatsappHref,
}: {
  products: OemInquiryProductOption[];
  whatsappHref: string;
}) {
  const t = useTranslations("OemOdmPage");

  return (
    <section
      id="oem-odm-get-started"
      className="rounded-3xl border border-line bg-white/50 p-6 shadow-(--shadow-card) sm:p-8 lg:p-10"
      aria-labelledby="oem-odm-get-started-heading"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("getStartedKicker")}
          </p>
          <h2
            id="oem-odm-get-started-heading"
            className="mt-3 font-serif text-2xl tracking-tight text-ink sm:text-3xl"
          >
            {t("getStartedHeading")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            {t("getStartedIntro")}
          </p>

          <ul className="mt-6 space-y-3">
            <li>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink/25 hover:bg-white"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                <span>
                  WhatsApp{" "}
                  <span className="font-normal text-muted">{WHATSAPP_DISPLAY}</span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={supportMailtoHref("OEM/ODM inquiry")}
                className="inline-flex items-center gap-2.5 rounded-2xl border border-line bg-paper/60 px-4 py-3 text-sm font-semibold text-ink transition hover:border-ink/25 hover:bg-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                <span>
                  {t("getStartedEmailLabel")}{" "}
                  <span className="font-normal text-muted">{SUPPORT_EMAIL}</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div className="relative min-w-0 rounded-2xl border border-line/80 bg-white/80 p-5 sm:p-6">
          <OemInquiryForm products={products} />
        </div>
      </div>
    </section>
  );
}
