import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogArticleBody } from "@/components/site/blog-article-body";
import { StorefrontImage } from "@/components/site/storefront-image";
import {
  formatBlogPostDate,
  getPublishedBlogPostBySlug,
  listPublishedBlogPosts,
} from "@/lib/blog-posts";
import { routing } from "@/i18n/routing";
import { absoluteOgImageUrl, getSiteUrl } from "@/lib/seo";
import { storefrontHreflangLanguages } from "@/lib/storefront-hreflang";

/** Cached until admin blog saves or deploy; no time-based expiry. */
export const revalidate = false;

export async function generateStaticParams() {
  try {
    const posts = await listPublishedBlogPosts();
    return routing.locales.flatMap((locale) =>
      posts.map((post) => ({ locale, slug: post.slug })),
    );
  } catch (e) {
    console.error("[blog] generateStaticParams: DB unavailable during build.", e);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "BlogArticle" });
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) {
    return { title: t("notFoundTitle") };
  }

  const description = post.excerpt.trim() || post.body.trim().slice(0, 160);
  const pathPrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const path = `${pathPrefix}/blog/${encodeURIComponent(post.slug)}`;
  const og = absoluteOgImageUrl(post.coverImageUrl.trim() || undefined);

  return {
    title: post.title,
    description,
    alternates: {
      canonical: path,
      languages: storefrontHreflangLanguages(`/blog/${encodeURIComponent(post.slug)}`),
    },
    openGraph: {
      type: "article",
      url: `${getSiteUrl()}${path}`,
      title: post.title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImageUrl.trim()
        ? [{ url: og, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: post.coverImageUrl.trim() ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.coverImageUrl.trim() ? [og] : undefined,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BlogArticle");
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  const dateLabel = formatBlogPostDate(post.publishedAt, locale);

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        {t("backToBlog")}
      </Link>

      <header className="mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {t("kicker")}
        </p>
        {dateLabel ? (
          <time
            dateTime={post.publishedAt?.toISOString()}
            className="mt-3 block text-sm text-muted"
          >
            {dateLabel}
          </time>
        ) : null}
        <h1 className="mt-3 w-full font-serif text-2xl leading-snug tracking-tight sm:text-3xl">
          {post.title}
        </h1>
        {post.excerpt.trim() ? (
          <p className="mt-4 w-full text-lg leading-relaxed text-muted">{post.excerpt}</p>
        ) : null}
      </header>

      {post.coverImageUrl.trim() ? (
        <div className="mt-10 overflow-hidden rounded-2xl bg-ink/[0.04] ring-1 ring-line">
          <StorefrontImage
            src={post.coverImageUrl}
            alt={post.title}
            width={0}
            height={0}
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="h-auto w-full"
          />
        </div>
      ) : null}

      <div className="mt-10 border-t border-line pt-10">
        <BlogArticleBody body={post.body} />
      </div>
    </article>
  );
}
