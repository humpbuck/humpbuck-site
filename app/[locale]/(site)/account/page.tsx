import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { userPublicDisplayName } from "@/lib/user-display-name";
import { prisma } from "@/lib/prisma";

export default async function AccountOverviewPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("Account");

  const [orderCount, user] = await Promise.all([
    prisma.order.count({
      where: { userId, deletedAt: null },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    }),
  ]);

  const greeting = user
    ? userPublicDisplayName(user, t("overviewGreetingFallback"))
    : t("overviewGreetingFallback");

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t("overviewKicker")}
      </p>
      <h1 className="mt-2 font-serif text-3xl tracking-tight">{t("overviewTitle")}</h1>
      <p className="mt-4 text-sm text-muted">
        {t("overviewIntro", { greeting })}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="rounded-2xl border border-line bg-white/60 p-5 transition hover:border-ink/15 hover:shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("sectionOrders")}
          </p>
          <p className="mt-2 font-medium text-ink">
            {orderCount === 0
              ? t("ordersCardEmpty")
              : t("ordersCardCount", { count: orderCount })}
          </p>
        </Link>
        <Link
          href="/account/details"
          className="rounded-2xl border border-line bg-white/60 p-5 transition hover:border-ink/15 hover:shadow-sm"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("profileKicker")}
          </p>
          <p className="mt-2 text-sm text-muted">{t("profileBlurb")}</p>
        </Link>
      </div>

      <p className="mt-10">
        <Link
          href="/product"
          className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink/70 underline-offset-4 hover:text-ink hover:underline"
        >
          {t("continueShopping")}
        </Link>
      </p>
    </div>
  );
}
