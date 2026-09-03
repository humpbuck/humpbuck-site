"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adminPath } from "@/lib/admin-path";

const NAV_LINK_CLASS =
  "inline-flex shrink-0 items-center text-[11px] font-semibold uppercase tracking-[0.12em] leading-none text-ink/75 hover:text-ink";

export function AdminProductsNavMenu() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function updatePosition() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
  }

  function openMenu() {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    updatePosition();
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 120);
  }

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      updatePosition();
    }
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-flex shrink-0 items-center"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <Link href={adminPath("/inventory")} className={NAV_LINK_CLASS}>
          PRODUCTS
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label="Products submenu"
          onClick={() => {
            if (open) {
              setOpen(false);
              return;
            }
            openMenu();
          }}
          className="ml-0.5 inline-flex items-center justify-center rounded p-0.5 text-ink/60 transition hover:text-ink"
        >
          <ChevronDown
            className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
              className="fixed z-80 min-w-54 rounded-xl border border-line bg-white p-1.5 shadow-md"
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
            >
              <Link
                href={adminPath("/home-product-arrange")}
                role="menuitem"
                className="block rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/80 transition hover:bg-ink/4 hover:text-ink"
                onClick={() => setOpen(false)}
              >
                Home product arrange
              </Link>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
