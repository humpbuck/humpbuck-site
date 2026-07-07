"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { ChevronDown, ChevronRight, Menu, ShoppingBag, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useCart } from "@/components/cart/cart-context";
import { AccountMenu } from "@/components/site/AccountMenu";
import { buildLoginHref } from "@/lib/auth-callback-url";
import { storefrontHomePath } from "@/lib/storefront-home-path";
import { CART_ADDED_EVENT } from "@/lib/cart-events";

const SHOP_DROPDOWN_LINKS = [
  { type: "link" as const, href: "/product", labelKey: "shopAllProducts" },
  { type: "flyout" as const, movement: "mechanical" as const, labelKey: "shopMechanical" },
  { type: "flyout" as const, movement: "quartz" as const, labelKey: "shopQuartz" },
];

const SHOP_LINK_CLASS =
  "block px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.08em] text-ink/90 transition hover:bg-ink/[0.04]";
const SHOP_FLYOUT_LINK_CLASS =
  "block px-4 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink/85 transition hover:bg-ink/[0.04]";

const NAV_ITEMS = [
  { labelKey: "blog", href: "/blog" },
  { labelKey: "about", href: "/about" },
] as const;

function ShopDropdownLink({
  href,
  label,
  className,
  onNavigate,
}: {
  href: string;
  label: string;
  className: string;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate} className={className}>
      {label}
    </Link>
  );
}

function ShopDropdownFlyout({
  movement,
  label,
  menLabel,
  womenLabel,
}: {
  movement: "mechanical" | "quartz";
  label: string;
  menLabel: string;
  womenLabel: string;
}) {
  return (
    <div className="group/item relative">
      <Link
        href={`/product?movement=${movement}`}
        className={`${SHOP_LINK_CLASS} flex items-center justify-between gap-3 pr-3`}
      >
        <span>{label}</span>
        <ChevronRight size={14} className="shrink-0 opacity-45" aria-hidden />
      </Link>
      <div className="pointer-events-none absolute left-full top-0 z-10 pl-1 opacity-0 transition group-hover/item:pointer-events-auto group-hover/item:opacity-100">
        <div
          role="menu"
          aria-label={label}
          className="min-w-[132px] rounded-2xl border border-line bg-paper/95 py-2 shadow-card backdrop-blur-md"
        >
          <Link
            href={`/product?movement=${movement}&audience=men`}
            className={SHOP_FLYOUT_LINK_CLASS}
          >
            {menLabel}
          </Link>
          <Link
            href={`/product?movement=${movement}&audience=women`}
            className={SHOP_FLYOUT_LINK_CLASS}
          >
            {womenLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function DesktopShopNav({
  tNav,
}: {
  tNav: ReturnType<typeof useTranslations<"Navigation">>;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-haspopup="menu"
        className={`inline-flex cursor-default items-center gap-1 ${NAV_LINK_CLASS}`}
      >
        {tNav("shop")}
        <ChevronDown
          size={12}
          strokeWidth={2}
          className="opacity-60 transition group-hover:rotate-180"
          aria-hidden
        />
      </button>
      <div className="pointer-events-none absolute left-0 top-full z-50 pt-3 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
        <div
          role="menu"
          aria-label={tNav("shop")}
          className="min-w-[200px] overflow-visible rounded-2xl border border-line bg-paper/95 py-2 shadow-card backdrop-blur-md"
        >
          {SHOP_DROPDOWN_LINKS.map((item) =>
            item.type === "link" ? (
              <ShopDropdownLink
                key={item.href}
                href={item.href}
                label={tNav(item.labelKey)}
                className={SHOP_LINK_CLASS}
              />
            ) : (
              <ShopDropdownFlyout
                key={item.movement}
                movement={item.movement}
                label={tNav(item.labelKey)}
                menLabel={tNav("shopMen")}
                womenLabel={tNav("shopWomen")}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function MobileShopNav({
  tNav,
  onNavigate,
}: {
  tNav: ReturnType<typeof useTranslations<"Navigation">>;
  onNavigate: () => void;
}) {
  return (
    <div className="rounded-xl">
      <p className="px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
        {tNav("shop")}
      </p>
      <div className="flex flex-col gap-1 pb-1 pl-2">
        {SHOP_DROPDOWN_LINKS.map((item) =>
          item.type === "link" ? (
            <ShopDropdownLink
              key={item.href}
              href={item.href}
              label={tNav(item.labelKey)}
              onNavigate={onNavigate}
              className="block rounded-xl px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/75 hover:bg-ink/[0.04]"
            />
          ) : (
            <div key={item.movement} className="flex flex-col">
              <ShopDropdownLink
                href={`/product?movement=${item.movement}`}
                label={tNav(item.labelKey)}
                onNavigate={onNavigate}
                className="block rounded-xl px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/75 hover:bg-ink/[0.04]"
              />
              <ShopDropdownLink
                href={`/product?movement=${item.movement}&audience=men`}
                label={tNav("shopMen")}
                onNavigate={onNavigate}
                className="block rounded-xl py-2 pl-8 pr-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60 hover:bg-ink/[0.04]"
              />
              <ShopDropdownLink
                href={`/product?movement=${item.movement}&audience=women`}
                label={tNav("shopWomen")}
                onNavigate={onNavigate}
                className="block rounded-xl py-2 pl-8 pr-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/60 hover:bg-ink/[0.04]"
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

const NAV_LINK_CLASS =
  "whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.1em] text-ink/75 transition hover:text-ink xl:text-[12px] xl:tracking-[0.14em]";

function HeaderLoginLink({
  className,
  onNavigate,
}: {
  className: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Navigation");
  return (
    <Link
      href={buildLoginHref(pathname, searchParams)}
      onClick={onNavigate}
      className={className}
    >
      {t("login")}
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const signOutCallbackUrl = storefrontHomePath(locale);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bagBump, setBagBump] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { itemCount, openCartDrawer } = useCart();
  const { data: session, status } = useSession();
  const displayItemCount = hydrated ? itemCount : 0;

  const navItems = useMemo(() => NAV_ITEMS, []);

  const accountMenuLabel =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    t("accountFallback");

  useEffect(() => {
    const onAdded = () => {
      setBagBump(false);
      requestAnimationFrame(() => setBagBump(true));
    };
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => window.removeEventListener(CART_ADDED_EVENT, onAdded);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-[var(--site-announcement-h,0px)] z-50 transition-[background,box-shadow,padding,top] duration-300 ${
          scrolled
            ? "border-b border-line bg-paper/90 py-3 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent py-4 md:py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {open ? (
              <div
                className="shrink-0 rounded-lg p-2 md:hidden"
                aria-hidden
              >
                <div className="h-[22px] w-[22px]" />
              </div>
            ) : (
              <button
                type="button"
                className="rounded-lg p-2 text-ink/80 hover:bg-ink/[0.04] hover:text-ink md:hidden"
                aria-label={t("openMenu")}
                onClick={() => setOpen(true)}
              >
                <Menu size={22} />
              </button>
            )}
            <Link
              href="/"
              className="font-serif text-xl tracking-tight text-ink sm:text-2xl"
            >
              HUMPBUCK
            </Link>
          </div>

          <nav className="hidden shrink-0 items-center gap-4 lg:flex xl:gap-6">
            <DesktopShopNav tNav={t} />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={NAV_LINK_CLASS}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {status === "authenticated" ? (
              <AccountMenu
                userEmail={session?.user?.email}
                userDisplayName={session?.user?.name}
              />
            ) : (
              <Suspense
                fallback={
                  <Link
                    href="/auth/login"
                    className="hidden rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 transition hover:text-ink md:inline-flex"
                  >
                    {t("login")}
                  </Link>
                }
              >
                <HeaderLoginLink className="hidden rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 transition hover:text-ink md:inline-flex" />
              </Suspense>
            )}
            <button
              type="button"
              data-bag-fly-target
              onClick={() => openCartDrawer()}
              onAnimationEnd={(e) => {
                if (e.animationName === "cart-bump") setBagBump(false);
              }}
              className={`inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90 ${bagBump ? "animate-cart-bump" : ""}`}
              aria-label={t("openBag", { count: displayItemCount })}
            >
              <ShoppingBag size={16} strokeWidth={1.75} />
              <span className="hidden sm:inline">{t("bag")}</span>
              <span className="tabular-nums">{displayItemCount}</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
      <div
        className={`fixed left-0 top-[var(--site-announcement-h,0px)] z-[60] flex h-[calc(100%-var(--site-announcement-h,0px))] w-[min(88vw,360px)] flex-col border-r border-line bg-paper transition-[transform,box-shadow,top] duration-300 ease-out md:hidden ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t("mainNav")}
        aria-hidden={!open}
      >
        <div className="flex h-16 min-w-0 items-center justify-between border-b border-line px-3 sm:px-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="min-w-0 truncate font-serif text-xl tracking-tight text-ink"
          >
            HUMPBUCK
          </Link>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-ink/70 hover:bg-ink/[0.04] active:bg-ink/10"
            onClick={() => setOpen(false)}
            aria-label={t("closeMenu")}
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex flex-col p-2">
          <MobileShopNav tNav={t} onNavigate={() => setOpen(false)} />
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink/85 hover:bg-ink/[0.04]"
            >
              {t(item.labelKey)}
            </Link>
          ))}
          <Link
            href="/shipping"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-xl px-4 py-3 text-sm text-muted hover:bg-ink/[0.04]"
          >
            {t("shippingTax")}
          </Link>
          <Link
            href="/refund"
            onClick={() => setOpen(false)}
            className="rounded-xl px-4 py-3 text-sm text-muted hover:bg-ink/[0.04]"
          >
            {t("refunds")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openCartDrawer();
            }}
            className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-ink/85 hover:bg-ink/[0.04]"
          >
            {t("bagWithCount", { count: displayItemCount })}
          </button>
          {status === "authenticated" ? (
            <>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="mt-4 block rounded-xl px-4 py-3 text-sm font-semibold text-ink/85 hover:bg-ink/[0.04]"
              >
                {accountMenuLabel}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut({ callbackUrl: signOutCallbackUrl });
                }}
                className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-muted hover:bg-ink/[0.04]"
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            <Suspense
              fallback={
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-xl px-4 py-3 text-sm font-semibold text-ink/85 hover:bg-ink/[0.04]"
                >
                  {t("login")}
                </Link>
              }
            >
              <HeaderLoginLink
                onNavigate={() => setOpen(false)}
                className="mt-2 block rounded-xl px-4 py-3 text-sm font-semibold text-ink/85 hover:bg-ink/[0.04]"
              />
            </Suspense>
          )}
        </nav>
      </div>
    </>
  );
}
