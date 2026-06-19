import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogArticleCard } from "@/components/site/blog-article-card";
import { listPublishedBlogPosts } from "@/lib/blog-posts";
import { routing } from "@/i18n/routing";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";
import { STOREFRONT_ISR_SECONDS } from "@/lib/storefront-revalidate";

export const revalidate = STOREFRONT_ISR_SECONDS;

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
  const posts = await listPublishedBlogPosts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="max-w-2xl border-b border-line pb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{t("intro")}</p>
      </header>

      {posts.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-8">
          {posts.map((post) => (
            <BlogArticleCard
              key={post.id}
              post={post}
              locale={locale}
              readMoreLabel={t("readMore")}
            />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-sm text-muted">{t("empty")}</p>
      )}
    </div>
  );
}
