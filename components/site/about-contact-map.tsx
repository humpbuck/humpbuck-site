import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  aboutPageMapEmbed,
  HUMPBUCK_STORE_MAPS_URL,
} from "@/lib/about-location";

export async function AboutContactMap() {
  const t = await getTranslations("AboutPage");
  const embed = aboutPageMapEmbed();

  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-line bg-stone-100 shadow-sm">
        <iframe
          title={t("mapIframeTitle")}
          src={embed.src}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      {embed.kind === "osm-fallback" ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("mapFallback")}</p>
      ) : null}
      <a
        href={HUMPBUCK_STORE_MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink underline-offset-2 transition hover:text-digital-dim hover:underline"
      >
        {t("openMapsLabel")}
        <ExternalLink size={13} strokeWidth={1.75} aria-hidden />
      </a>
    </div>
  );
}
