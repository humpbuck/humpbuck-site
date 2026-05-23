import {
  CreditCard,
  Mail,
  MessageCircle,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import { WholesaleIndexJsonLd } from "@/components/seo/wholesale-json-ld";
import { WholesaleContactActions } from "@/components/site/wholesale-contact-actions";
import { WholesaleListingsSection } from "@/components/site/wholesale-listings-section";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { listActiveWholesaleListings } from "@/lib/wholesale-listings";
import type { LucideIcon } from "lucide-react";

export async function WholesalePageBody({
  locale,
  initialOpenSlug,
}: {
  locale: string;
  initialOpenSlug?: string;
}) {
  setRequestLocale(locale);
  const t = await getTranslations("WholesalePage");
  const listings = await listActiveWholesaleListings();

  const infoCards: {
    icon: LucideIcon;
    headingKey: "inventoryHeading" | "beforeOrderHeading" | "shippingHeading" | "paymentHeading";
    bodyKey: "inventoryBody" | "beforeOrderBody" | "shippingBody" | "paymentBody";
  }[] = [
    { icon: RefreshCw, headingKey: "inventoryHeading", bodyKey: "inventoryBody" },
    { icon: MessageCircle, headingKey: "beforeOrderHeading", bodyKey: "beforeOrderBody" },
    { icon: Truck, headingKey: "shippingHeading", bodyKey: "shippingBody" },
    { icon: CreditCard, headingKey: "paymentHeading", bodyKey: "paymentBody" },
  ];

  const steps: {
    icon: LucideIcon;
    titleKey: "stepContactTitle" | "stepConfirmTitle" | "stepPayTitle" | "stepShipTitle";
    bodyKey: "stepContactBody" | "stepConfirmBody" | "stepPayBody" | "stepShipBody";
  }[] = [
    { icon: Mail, titleKey: "stepContactTitle", bodyKey: "stepContactBody" },
    { icon: Package, titleKey: "stepConfirmTitle", bodyKey: "stepConfirmBody" },
    { icon: CreditCard, titleKey: "stepPayTitle", bodyKey: "stepPayBody" },
    { icon: Truck, titleKey: "stepShipTitle", bodyKey: "stepShipBody" },
  ];

  return (
    <>
      <WholesaleIndexJsonLd
        locale={locale}
        pageName={t("title")}
        pageDescription={t("metaDescription")}
        listings={listings}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{t("intro")}</p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {infoCards.map(({ icon: Icon, headingKey, bodyKey }) => (
          <div
            key={headingKey}
            className="rounded-3xl border border-line bg-white/70 p-6 shadow-card"
          >
            <Icon className="text-luxe-dim" size={22} strokeWidth={1.75} />
            <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t(headingKey)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/85">{t(bodyKey)}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, titleKey, bodyKey }) => (
          <div key={titleKey} className="rounded-3xl border border-line bg-paper p-6">
            <Icon className="text-luxe-dim" size={22} strokeWidth={1.75} />
            <div className="mt-4 font-serif text-lg">{t(titleKey)}</div>
            <p className="mt-2 text-sm text-muted">{t(bodyKey)}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-stone-400/25 bg-stone-300/90 p-8 shadow-card sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              {t("ctaKicker")}
            </p>
            <h2 className="mt-3 font-serif text-2xl text-ink">{t("ctaTitle")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("ctaLead")}</p>
          </div>
          <WholesaleContactActions />
        </div>
      </div>

      <WholesaleListingsSection listings={listings} initialOpenSlug={initialOpenSlug} />
    </div>
    </>
  );
}
