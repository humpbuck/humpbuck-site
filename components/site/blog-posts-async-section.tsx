import { setRequestLocale } from "next-intl/server";
import { BlogArticleCard } from "@/components/site/blog-article-card";
import { listPublishedBlogPosts } from "@/lib/blog-posts";

export async function BlogPostsAsyncSection({
  locale,
  readMoreLabel,
  emptyLabel,
}: {
  locale: string;
  readMoreLabel: string;
  emptyLabel: string;
}) {
  setRequestLocale(locale);
  const posts = await listPublishedBlogPosts();

  if (posts.length === 0) {
    return <p className="mt-10 text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-8">
      {posts.map((post) => (
        <BlogArticleCard
          key={post.id}
          post={post}
          locale={locale}
          readMoreLabel={readMoreLabel}
        />
      ))}
    </div>
  );
}
