import { blogPostPublicPath } from "@/lib/blog-post-shared";
import { listPublishedHomeCarouselBlogPosts } from "@/lib/blog-posts";

export type HomeBlogDualCarouselItem = {
  href: string;
  src: string;
  alt: string;
  title: string;
  excerpt: string;
};

export async function getHomeBlogDualCarouselItems(): Promise<HomeBlogDualCarouselItem[]> {
  const posts = await listPublishedHomeCarouselBlogPosts();
  return posts.slice(0, 6).map((post) => ({
    src: post.homeCarouselImageUrl.trim() || post.coverImageUrl,
    href: blogPostPublicPath(post.slug),
    alt: post.title,
    title: post.title,
    excerpt: post.homeCarouselDescription.trim() || post.excerpt,
  }));
}
