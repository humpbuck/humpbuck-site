import { renderBlogInline } from "@/components/site/blog-inline-text";

export function BlogArticleBody({ body }: { body: string }) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className="space-y-5 text-base leading-relaxed text-ink/85 sm:text-lg sm:leading-relaxed">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-line">
          {renderBlogInline(paragraph)}
        </p>
      ))}
    </div>
  );
}
