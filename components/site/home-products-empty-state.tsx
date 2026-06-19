import { getTranslations } from "next-intl/server";

export async function HomeProductsEmptyState({ className }: { className?: string }) {
  const t = await getTranslations("Home");

  return (
    <p
      className={
        className ??
        "mt-12 text-center text-sm leading-relaxed text-muted sm:mt-14"
      }
    >
      {t("sectionNoProducts")}
    </p>
  );
}
