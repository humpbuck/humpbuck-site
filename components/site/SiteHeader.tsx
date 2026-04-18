"use client";

import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { AccountMenu } from "@/components/site/AccountMenu";
import { buildLoginHref } from "@/lib/auth-callback-url";
import { CART_ADDED_EVENT } from "@/lib/cart-events";

const nav = [
  { label: "Shop", href: "/shop" },
  { label: "DIGI-TEMP", href: "/series/digitemp" },
  { label: "RM-TONNEAU", href: "/series/tonneau" },
  { label: "RD-ASTRAL", href: "/series/rd-astral" },
  { label: "Wholesale", href: "/wholesale" },
  { label: "About", href: "/about" },
] as const;

function HeaderLoginLink({
  className,
  onNavigate,
}: {
  className: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <Link
      href={buildLoginHref(pathname, searchParams)}
      onClick={onNavigate}
      className={className}
    >
      Login
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bagBump, setBagBump] = useState(false);
  const { itemCount } = useCart();
  const { data: session, status } = useSession();

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
        className={`fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,padding] duration-300 ${
          scrolled
            ? "border-b border-[color:var(--color-line)] bg-paper/90 py-3 shadow-sm backdrop-blur-md"
            : "border-b border-transparent bg-transparent py-4 md:py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-ink/80 hover:bg-ink/[0.04] hover:text-ink md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link
              href="/"
              className="font-serif text-xl tracking-tight text-ink sm:text-2xl"
            >
              HUMPBUCK
            </Link>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/75 transition hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              className="hidden rounded-full border border-[color:var(--color-line)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80 transition hover:border-ink/20 hover:text-ink sm:inline-flex"
            >
              Catalog
            </Link>
            {status === "authenticated" ? (
              <AccountMenu userEmail={session?.user?.email} />
            ) : (
              <Suspense
                fallback={
                  <Link
                    href="/auth/login"
                    className="hidden rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 transition hover:text-ink md:inline-flex"
                  >
                    Login
                  </Link>
                }
              >
                <HeaderLoginLink className="hidden rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75 transition hover:text-ink md:inline-flex" />
              </Suspense>
            )}
            <Link
              href="/cart"
              data-bag-fly-target
              onAnimationEnd={(e) => {
                if (e.animationName === "cart-bump") setBagBump(false);
              }}
              className={`inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90 ${bagBump ? "animate-cart-bump" : ""}`}
              aria-label={`Shopping bag, ${itemCount} items`}
            >
              <ShoppingBag size={16} strokeWidth={1.75} />
              <span className="hidden sm:inline">Bag</span>
              <span className="tabular-nums">{itemCount}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
      <div
        className={`fixed left-0 top-0 z-40 h-full w-[min(88vw,360px)] border-r border-[color:var(--color-line)] bg-paper shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[color:var(--color-line)] px-4">
          <span className="font-serif text-lg">Menu</span>
          <button
            type="button"
            className="rounded-lg p-2 text-ink/70 hover:bg-ink/[0.04]"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex flex-col p-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink/85 hover:bg-ink/[0.04]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/shipping"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-xl px-4 py-3 text-sm text-muted hover:bg-ink/[0.04]"
          >
            Shipping & tax
          </Link>
          <Link
            href="/refund"
            onClick={() => setOpen(false)}
            className="rounded-xl px-4 py-3 text-sm text-muted hover:bg-ink/[0.04]"
          >
            Refunds
          </Link>
          <Link
            href="/cart"
            onClick={() => setOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-ink/85 hover:bg-ink/[0.04]"
          >
            Bag ({itemCount})
          </Link>
          {status === "authenticated" ? (
            <>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold text-ink/85 hover:bg-ink/[0.04]"
              >
                My account
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
                className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-muted hover:bg-ink/[0.04]"
              >
                Sign out
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
                  Login
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
