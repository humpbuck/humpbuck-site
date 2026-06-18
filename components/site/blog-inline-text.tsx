import {
  BLOG_INLINE_COLOR_CLASS,
  BLOG_INLINE_FONT_CLASS,
  parseBlogInline,
  type BlogInlinePart,
} from "@/lib/blog-article-inline";

function BlogInlinePartView({ part }: { part: BlogInlinePart }) {
  switch (part.type) {
    case "strong":
      return (
        <strong className="font-semibold text-ink">
          <BlogInlineText parts={part.children} />
        </strong>
      );
    case "em":
      return (
        <em className="text-ink/90">
          <BlogInlineText parts={part.children} />
        </em>
      );
    case "color":
      return (
        <span className={BLOG_INLINE_COLOR_CLASS[part.name]}>
          <BlogInlineText parts={part.children} />
        </span>
      );
    case "font":
      return (
        <span className={BLOG_INLINE_FONT_CLASS[part.name]}>
          <BlogInlineText parts={part.children} />
        </span>
      );
    case "text":
    default:
      return <>{part.value}</>;
  }
}

export function BlogInlineText({ parts }: { parts: BlogInlinePart[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <BlogInlinePartView key={index} part={part} />
      ))}
    </>
  );
}

export function renderBlogInline(text: string) {
  return <BlogInlineText parts={parseBlogInline(text)} />;
}
