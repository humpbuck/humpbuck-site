import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogPostsAsyncSection } from "@/components/site/blog-posts-async-section";
import { BlogPostsGridFallback } from "@/components/site/route-section-fallbacks";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

/** Keep in sync with `STOREFRONT_ISR_SECONDS`. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BlogPage" });
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/blog`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages("/blog"),
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BlogPage");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-2xl border-b border-line pb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{t("intro")}</p>
      </header>

      <Suspense fallback={<BlogPostsGridFallback />}>
        <BlogPostsAsyncSection
          locale={locale}
          readMoreLabel={t("readMore")}
          emptyLabel={t("empty")}
        />
      </Suspense>
    </div>
  );
}
