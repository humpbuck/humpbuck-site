import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CookieSettingsLink } from "@/components/analytics/cookie-settings-link";
import { HumpbuckSocialLinks } from "@/components/site/humpbuck-social-links";
import { LocaleSwitcher } from "@/components/site/LocaleSwitcher";
import { publicSupportEmail } from "@/lib/support-contact";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const supportMail = publicSupportEmail();
  const year = new Date().getFullYear();

  const cols = [
    {
      title: t("shopTitle"),
      links: [
        { label: t("allProducts"), href: "/shop" },
        { label: t("linkMechanical"), href: "/shop?movement=mechanical" },
        { label: t("linkQuartz"), href: "/shop?movement=quartz" },
      ],
    },
    {
      title: t("companyTitle"),
      links: [
        { label: t("affiliates"), href: "/affiliates" },
        { label: t("about"), href: "/about" },
      ],
    },
    {
      title: t("supportTitle"),
      links: [
        { label: t("shippingTax"), href: "/shipping" },
        { label: t("refundPolicy"), href: "/refund" },
        { label: t("privacyPolicy"), href: "/privacy" },
        { label: t("termsOfService"), href: "/terms" },
      ],
    },
  ] as const;

  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:pb-14 md:pt-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_2fr] md:gap-10">
          <div className="min-w-0">
            <div className="font-serif text-2xl tracking-tight">HUMPBUCK</div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted sm:mt-4">
              {t("tagline")}
            </p>
            <p className="mt-4 text-[11px] uppercase leading-snug tracking-[0.14em] text-muted sm:mt-6 sm:text-xs sm:tracking-[0.16em]">
              {t("highlights")}
            </p>
            <div className="mt-5 sm:mt-6">
              <HumpbuckSocialLinks
                labels={{
                  facebook: t("socialFacebookAria"),
                  instagram: t("socialInstagramAria"),
                  youtube: t("socialYoutubeAria"),
                  tiktok: t("socialTiktokAria"),
                }}
              />
            </div>
          </div>
          <div className="flex w-full min-w-0 justify-center">
            <div className="grid w-full min-w-0 max-w-2xl grid-cols-3 gap-x-3 sm:gap-x-8">
              {cols.map((c) => (
                <div
                  key={c.title}
                  className="flex min-w-0 max-w-full flex-col items-center"
                >
                  <div className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/55 sm:text-[11px] sm:tracking-[0.18em]">
                    {c.title}
                  </div>
                  <ul className="mt-3 w-fit max-w-full space-y-2 text-left sm:mt-4">
                    {c.links.map((l) => (
                      <li key={l.href}>
                        <Link
                          href={l.href}
                          className="block break-words text-[12px] leading-snug text-ink/75 transition hover:text-ink sm:text-sm"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-4 border-t border-line pt-7 sm:mt-12 sm:pt-8">
          <div className="grid gap-4 sm:grid-cols-[1fr_1.1fr] sm:items-start sm:gap-10">
            <div className="min-w-0 space-y-2.5 text-left">
              <p className="text-[12px] leading-relaxed text-muted">
                {t("copyright", { year })}
              </p>
              <LocaleSwitcher />
              <div>
                <CookieSettingsLink />
              </div>
            </div>
            <p className="min-w-0 text-[12px] leading-relaxed text-muted sm:text-balance sm:text-right">
              {t("disclaimer")}{" "}
              <a
                href={`mailto:${supportMail}`}
                className="break-words text-ink/80 underline underline-offset-2 transition hover:text-ink"
              >
                {supportMail}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
