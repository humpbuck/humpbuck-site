import { ChevronDown } from "lucide-react";

export function HomeCertaintyFaqItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-line/90 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,17,20,0.02)] open:shadow-sm sm:px-6 sm:py-[1.15rem]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold leading-snug text-ink marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={18}
          strokeWidth={1.75}
          className="shrink-0 text-muted transition duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}
