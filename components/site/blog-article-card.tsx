import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { StorefrontImage } from "@/components/site/storefront-image";
import { blogPostPublicPath, formatBlogPostDate } from "@/lib/blog-post-shared";
import type { BlogPostRow } from "@/lib/blog-post-shared";

export function BlogArticleCard({
  post,
  locale,
  readMoreLabel,
}: {
  post: Pick<BlogPostRow, "slug" | "title" | "excerpt" | "coverImageUrl" | "publishedAt">;
  locale: string;
  readMoreLabel: string;
}) {
  const dateLabel = formatBlogPostDate(post.publishedAt, locale);
  const href = blogPostPublicPath(post.slug);

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white/60 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="overflow-hidden bg-ink/[0.04]">
        {post.coverImageUrl.trim() ? (
          <StorefrontImage
            src={post.coverImageUrl}
            alt={post.title}
            width={0}
            height={0}
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="h-auto w-full transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-[3/2] items-center justify-center bg-gradient-to-br from-ink/[0.03] to-ink/[0.08] px-6 text-center">
            <span className="font-serif text-lg text-ink/35">{post.title}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {dateLabel ? (
          <time
            dateTime={post.publishedAt?.toISOString()}
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted"
          >
            {dateLabel}
          </time>
        ) : null}
        <h2 className="mt-2 font-serif text-xl leading-snug tracking-tight text-ink group-hover:text-ink/90 sm:text-2xl">
          {post.title}
        </h2>
        {post.excerpt.trim() ? (
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
            {post.excerpt}
          </p>
        ) : null}
        <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/55 transition group-hover:text-ink">
          {readMoreLabel}
          <ArrowRight
            size={13}
            strokeWidth={1.5}
            className="transition group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
