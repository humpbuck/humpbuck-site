import { Link } from "@/i18n/navigation";
import { StorefrontImage } from "@/components/site/storefront-image";
import { normalizeProductHref } from "@/lib/blog-article-blocks";

type BlogLinkedImageProps = {
  src: string;
  alt: string;
  href?: string;
};

/** Inline blog image — natural size up to a readable max, centered in the column. */
const BLOG_INLINE_IMAGE_CLASS =
  "block h-auto w-auto max-h-[min(70vh,560px)] max-w-full object-contain";

export function BlogLinkedImage({ src, alt, href }: BlogLinkedImageProps) {
  const safeHref = normalizeProductHref(href ?? "");
  const image = (
    <StorefrontImage
      src={src}
      alt={alt}
      width={1280}
      height={960}
      sizes="(max-width: 640px) 100vw, 640px"
      className={BLOG_INLINE_IMAGE_CLASS}
    />
  );

  const frame = (
    <div className="inline-block max-w-[min(100%,640px)] overflow-hidden rounded-2xl bg-ink/[0.04] ring-1 ring-line transition duration-300 group-hover:ring-ink/20">
      {image}
    </div>
  );

  if (!safeHref) {
    return <figure className="my-4 flex justify-center">{frame}</figure>;
  }

  return (
    <figure className="group my-4 flex justify-center">
      <Link
        href={safeHref}
        className="inline-block outline-offset-4 focus-visible:outline-2 focus-visible:outline-ink/40"
      >
        {frame}
      </Link>
    </figure>
  );
}
