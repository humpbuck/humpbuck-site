type Props = {
  html: string;
  className?: string;
};

/** Renders merchant-authored TipTap HTML for blog articles. */
export function BlogContent({ html, className }: Props) {
  if (!html?.trim()) return null;
  return (
    <div
      className={className ?? "blog-content mx-auto max-w-3xl"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
