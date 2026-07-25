import { BlogContent } from "@/components/site/blog-content";

/** Renders TipTap HTML from the admin blog editor. */
export function BlogArticleBody({ body }: { body: string }) {
  return <BlogContent html={body} />;
}
