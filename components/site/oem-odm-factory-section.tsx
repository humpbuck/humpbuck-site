import { BlogVideoEmbed } from "@/components/site/blog-video-embed";
import { OemOdmFeaturedModels } from "@/components/site/oem-odm-featured-models";
import { OemOdmGetStartedSection } from "@/components/site/oem-odm-get-started-section";
import { resolveOemOdmFeaturedModels } from "@/lib/oem-odm-featured-slugs";
import { buildOemInquiryProductOptions } from "@/lib/oem-inquiry-products";
import { OEM_ODM_PROMO_VIDEO_URL } from "@/lib/oem-odm-page-content";
import { getMergedCatalogProducts } from "@/lib/catalog-db";
import { getSiteUrl } from "@/lib/seo";
import { applyStorefrontProductLocale } from "@/lib/storefront-locale";
import { whatsappHrefWithBody } from "@/lib/whatsapp";
import {
  ClipboardList,
  CreditCard,
  Factory,
  Package,
  Sparkles,
  Truck,
} from "lucide-react";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

type OemOdmServiceOption = {
  label: string;
  recommended?: boolean;
  text: string;
};

type OemOdmMoqRow = {
  type: string;
  moqPerColor: string;
  totalOrderMoq: string;
  whyChoose: string;
  isOdm: boolean;
};

type OemOdmContentItem = {
  label: string;
  text: string;
};

type OemOdmContentSection = {
  key: "samplePolicy" | "customization" | "payment" | "logistics";
  heading: string;
  intro?: string;
  items: OemOdmContentItem[];
};

function OemOdmServiceCard({
  option,
  recommendedLabel,
  summaryLine,
  partnershipNote,
}: {
  option: OemOdmServiceOption;
  recommendedLabel: string;
  summaryLine?: string;
  partnershipNote?: string;
}) {
  const isRecommended = option.recommended === true;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 transition sm:p-6 ${
        isRecommended
          ? "border-luxe/50 bg-gradient-to-br from-white via-white to-luxe/[0.06] shadow-(--shadow-card)"
          : "border-line bg-white/50"
      }`}
    >
      {isRecommended ? (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-luxe/10"
          aria-hidden
        />
      ) : null}
      <div className="relative flex flex-wrap items-center gap-2">
        <h3 className="font-serif text-xl tracking-tight text-ink sm:text-2xl">
          {option.label}
        </h3>
        {isRecommended ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper">
            <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
            {recommendedLabel}
          </span>
        ) : null}
      </div>
      <p className="relative mt-3 text-sm leading-relaxed text-muted sm:text-base sm:leading-relaxed">
        {option.text}
      </p>
      {summaryLine ? (
        <p className="relative mt-3 text-xs font-medium tracking-wide text-ink/80 sm:text-sm">
          {summaryLine}
        </p>
      ) : null}
      {partnershipNote ? (
        <p className="relative mt-3 text-sm leading-relaxed text-muted">
          {partnershipNote}
        </p>
      ) : null}
    </article>
  );
}

function OemOdmMoqCards({
  kicker,
  heading,
  colPerColor,
  colTotal,
  colWhy,
  starterBadge,
  bespokeBadge,
  rows,
}: {
  kicker: string;
  heading: string;
  colPerColor: string;
  colTotal: string;
  colWhy: string;
  starterBadge: string;
  bespokeBadge: string;
  rows: OemOdmMoqRow[];
}) {
  return (
    <div className="mt-14 lg:mt-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {kicker}
        </p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight text-ink sm:text-3xl">
          {heading}
        </h2>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6">
        {rows.map((row, index) => {
          const isOdm = row.isOdm;

          return (
            <article
              key={row.type}
              className={`flex flex-col rounded-2xl border p-6 sm:p-7 ${
                isOdm
                  ? "border-luxe/40 bg-white shadow-(--shadow-card)"
                  : "border-line bg-white/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg tracking-tight text-ink sm:text-xl">
                  {row.type}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                    isOdm
                      ? "bg-luxe/15 text-luxe-dim"
                      : "bg-ink/[0.06] text-muted"
                  }`}
                >
                  {index === 0 ? starterBadge : bespokeBadge}
                </span>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-line/80 bg-paper/60 px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {colPerColor}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">
                    {row.moqPerColor}
                  </dd>
                </div>
                <div className="rounded-xl border border-line/80 bg-paper/60 px-4 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {colTotal}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-ink">
                    {row.totalOrderMoq}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 text-sm leading-relaxed text-muted sm:text-base">
                <span className="font-semibold text-ink">{colWhy}</span>{" "}
                {row.whyChoose}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function OemOdmProcessTimeline({ section }: { section: OemOdmContentSection }) {
  return (
    <section className="rounded-3xl border border-line bg-white/50 p-6 shadow-(--shadow-card) sm:p-8 lg:p-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink">
          <ClipboardList size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-[1.65rem]">
          {section.heading}
        </h2>
      </div>

      <ol className="relative mt-8 space-y-0">
        {section.items.map((item, index) => {
          const isLast = index === section.items.length - 1;

          return (
            <li key={item.label} className="relative flex gap-4 pb-8 sm:gap-5 sm:pb-10">
              {!isLast ? (
                <span
                  className="absolute left-4 top-10 bottom-0 w-px bg-line sm:left-[1.125rem]"
                  aria-hidden
                />
              ) : null}
              <span
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper sm:h-9 sm:w-9 sm:text-xs"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="sr-only">{item.label}</p>
                <p className="text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
                  {item.text}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function OemOdmPaymentSection({
  section,
  depositShort,
  balanceShort,
}: {
  section: OemOdmContentSection;
  depositShort: string;
  balanceShort: string;
}) {
  const [depositItem, balanceItem, methodsItem] = section.items;

  return (
    <section className="flex h-full flex-col rounded-3xl border border-line bg-white/50 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink">
          <CreditCard size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-[1.65rem]">
          {section.heading}
        </h2>
      </div>

      {section.intro ? (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {section.intro}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        <div className="flex h-3">
          <span className="w-[30%] bg-luxe" aria-hidden />
          <span className="w-[70%] bg-ink/80" aria-hidden />
        </div>
        <div className="grid grid-cols-2 divide-x divide-line bg-paper/50">
          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-luxe-dim">
              30%
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{depositShort}</p>
          </div>
          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              70%
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{balanceShort}</p>
          </div>
        </div>
      </div>

      <ul className="mt-5 flex-1 space-y-4">
        {[depositItem, balanceItem, methodsItem]
          .filter((item): item is NonNullable<typeof item> => item != null)
          .map((item) => (
            <li key={item.label} className="flex gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-luxe"
                aria-hidden
              />
              <div className="min-w-0 text-sm leading-relaxed text-muted sm:text-base">
                <span className="font-semibold text-ink">{item.label}: </span>
                {item.text}
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}

function OemOdmLogisticsSection({ section }: { section: OemOdmContentSection }) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-line bg-white/50 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink">
          <Truck size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-[1.65rem]">
          {section.heading}
        </h2>
      </div>

      {section.intro ? (
        <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {section.intro}
        </p>
      ) : null}

      <ul className="mt-5 flex-1 space-y-4">
        {section.items.map((item) => (
          <li
            key={item.label}
            className="rounded-xl border border-line/80 bg-paper/50 p-4 sm:p-5"
          >
            <p className="text-sm font-semibold text-ink sm:text-base">{item.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OemOdmSamplePolicySection({ section }: { section: OemOdmContentSection }) {
  return (
    <section className="rounded-3xl border border-line bg-white/50 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink">
          <Package size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="font-serif text-2xl tracking-tight text-ink sm:text-[1.65rem]">
          {section.heading}
        </h2>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {section.items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-line/80 bg-paper/50 p-4 sm:p-5"
          >
            <p className="text-sm font-semibold text-ink sm:text-base">{item.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function OemOdmFactorySection() {
  const locale = await getLocale();
  const messages = await getMessages({ locale });
  const t = await getTranslations("OemOdmPage");
  const catalogRaw = await getMergedCatalogProducts();
  const catalog = catalogRaw.map((p) =>
    applyStorefrontProductLocale(p, locale, messages),
  );
  const featuredModels = resolveOemOdmFeaturedModels(catalog);

  const inquiryProducts = buildOemInquiryProductOptions(catalog, {
    locale,
    messages,
  });

  const oemOdmPageUrl = `${getSiteUrl()}/oem-odm`;
  const whatsappHref = whatsappHrefWithBody(
    `Hi, I have a question about OEM/ODM:\n${oemOdmPageUrl}`,
  );

  const serviceOptions: OemOdmServiceOption[] = [
    { label: t("odmLabel"), recommended: true, text: t("odmText") },
    { label: t("oemLabel"), text: t("oemText") },
  ];

  const moqRows: OemOdmMoqRow[] = [
    {
      type: t("moqOdmType"),
      moqPerColor: t("moqOdmPerColor"),
      totalOrderMoq: t("moqOdmTotal"),
      whyChoose: t("moqOdmWhy"),
      isOdm: true,
    },
    {
      type: t("moqOemType"),
      moqPerColor: t("moqOemPerColor"),
      totalOrderMoq: t("moqOemTotal"),
      whyChoose: t("moqOemWhy"),
      isOdm: false,
    },
  ];

  const samplePolicy: OemOdmContentSection = {
    key: "samplePolicy",
    heading: t("samplePolicyHeading"),
    items: [
      {
        label: t("samplePolicyShowroomLabel"),
        text: t("samplePolicyShowroomText"),
      },
      {
        label: t("samplePolicyCostLabel"),
        text: t("samplePolicyCostText"),
      },
    ],
  };

  const process: OemOdmContentSection = {
    key: "customization",
    heading: t("customizationHeading"),
    items: [
      { label: "Step 1", text: t("customizationStep1Text") },
      { label: "Step 2", text: t("customizationStep2Text") },
      { label: "Step 3", text: t("customizationStep3Text") },
      { label: "Step 4", text: t("customizationStep4Text") },
      { label: "Step 5", text: t("customizationStep5Text") },
    ],
  };

  const payment: OemOdmContentSection = {
    key: "payment",
    heading: t("paymentHeading"),
    intro: t("paymentIntro"),
    items: [
      { label: t("paymentDepositLabel"), text: t("paymentDepositText") },
      { label: t("paymentBalanceLabel"), text: t("paymentBalanceText") },
      { label: t("paymentMethodsLabel"), text: t("paymentMethodsText") },
    ],
  };

  const logistics: OemOdmContentSection = {
    key: "logistics",
    heading: t("logisticsHeading"),
    intro: t("logisticsIntro"),
    items: [
      { label: t("logisticsAgentLabel"), text: t("logisticsAgentText") },
      { label: t("logisticsGlobalLabel"), text: t("logisticsGlobalText") },
    ],
  };

  return (
    <section
      className="border-b border-line bg-paper"
      aria-labelledby="oem-odm-factory-heading"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-5xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              <Factory className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
              {t("sectionKicker")}
            </p>
            <h1
              id="oem-odm-factory-heading"
              className="mt-4 font-serif text-3xl tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]"
            >
              {t("sectionTitle")}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              {t("introLine1")}
              <br />
              {t("introLine2")}
            </p>
          </div>

          <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12 xl:gap-16">
            <div className="flex min-w-0 flex-col lg:pt-14 [&_figure]:my-0">
              <BlogVideoEmbed
                src={OEM_ODM_PROMO_VIDEO_URL}
                aspectRatio="16:9"
                title={t("promoVideoAria")}
              />
              <p className="mt-3 text-center text-sm font-medium text-muted lg:text-left">
                {t("promoVideoCaption")}
              </p>
            </div>

            <div className="min-w-0 space-y-4 lg:space-y-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                {t("serviceModelsKicker")}
              </p>
              {serviceOptions.map((option) => (
                <OemOdmServiceCard
                  key={option.label}
                  option={option}
                  recommendedLabel={t("recommendedBadge")}
                  summaryLine={option.recommended ? t("odmSummaryLine") : undefined}
                  partnershipNote={option.recommended ? undefined : t("oemPartnershipNote")}
                />
              ))}
            </div>
          </div>

          <OemOdmFeaturedModels models={featuredModels} />

          <OemOdmMoqCards
            kicker={t("moqKicker")}
            heading={t("moqHeading")}
            colPerColor={t("moqColPerColor")}
            colTotal={t("moqColTotal")}
            colWhy={t("moqColWhy")}
            starterBadge={t("moqStarterBadge")}
            bespokeBadge={t("moqBespokeBadge")}
            rows={moqRows}
          />

          <div className="mt-14 space-y-6 lg:mt-20 lg:space-y-8">
            <OemOdmSamplePolicySection section={samplePolicy} />
            <OemOdmProcessTimeline section={process} />

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <OemOdmPaymentSection
                section={payment}
                depositShort={t("paymentDepositShort")}
                balanceShort={t("paymentBalanceShort")}
              />
              <OemOdmLogisticsSection section={logistics} />
            </div>

            <OemOdmGetStartedSection
              products={inquiryProducts}
              whatsappHref={whatsappHref}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
