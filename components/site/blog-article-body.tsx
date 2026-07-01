import { renderBlogInline } from "@/components/site/blog-inline-text";
import { BlogLinkedImage } from "@/components/site/blog-linked-image";
import { BlogProductEmbed } from "@/components/site/blog-product-embed";
import { BlogVideoEmbed } from "@/components/site/blog-video-embed";
import { parseBlogBody, type BlogBodySegment } from "@/lib/blog-article-blocks";

function BlogParagraph({ text }: { text: string }) {
  return (
    <p className="whitespace-pre-line">{renderBlogInline(text)}</p>
  );
}

function BlogBodySegmentView({ segment }: { segment: BlogBodySegment }) {
  switch (segment.type) {
    case "image":
      if (!segment.src.trim()) return null;
      return (
        <BlogLinkedImage
          src={segment.src}
          alt={segment.alt.trim() || "Blog image"}
          href={segment.href}
        />
      );
    case "product":
      if (!segment.slug.trim()) return null;
      return <BlogProductEmbed slug={segment.slug} />;
    case "video":
      if (!segment.src.trim()) return null;
      return (
        <BlogVideoEmbed
          src={segment.src}
          aspectRatio={segment.aspectRatio}
          title={segment.title}
        />
      );
    case "paragraph":
    default:
      return <BlogParagraph text={segment.text} />;
  }
}

export async function BlogArticleBody({ body }: { body: string }) {
  const segments = parseBlogBody(body);
  if (segments.length === 0) return null;

  return (
    <div className="space-y-5 text-base leading-relaxed text-ink/85 sm:text-lg sm:leading-relaxed">
      {segments.map((segment, index) => (
        <BlogBodySegmentView key={`${index}-${segment.type}`} segment={segment} />
      ))}
    </div>
  );
}
