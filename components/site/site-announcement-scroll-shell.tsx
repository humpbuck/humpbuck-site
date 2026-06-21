"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SITE_ANNOUNCEMENT_BAR_HEIGHT_PX } from "@/lib/site-announcement";

const SCROLL_DELTA_PX = 6;
const SHOW_AT_TOP_PX = 4;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function SiteAnnouncementScrollShell({
  children,
  backgroundColor,
  height = SITE_ANNOUNCEMENT_BAR_HEIGHT_PX,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  height?: number;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const collapsed = hidden && !reducedMotion;

  useEffect(() => {
    const root = document.documentElement;
    const visibleHeight = `${height}px`;

    root.style.setProperty("--site-announcement-h", visibleHeight);
    lastScrollY.current = window.scrollY;

    if (reducedMotion) {
      return () => {
        root.style.removeProperty("--site-announcement-h");
      };
    }

    const onScroll = () => {
      const y = window.scrollY;
      const prev = lastScrollY.current;

      if (y <= SHOW_AT_TOP_PX) {
        setHidden(false);
      } else if (y > prev + SCROLL_DELTA_PX) {
        setHidden(true);
      } else if (y < prev - SCROLL_DELTA_PX) {
        setHidden(false);
      }

      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.style.removeProperty("--site-announcement-h");
    };
  }, [height, reducedMotion]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--site-announcement-h",
      collapsed ? "0px" : `${height}px`,
    );
  }, [collapsed, height]);

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[55] ${
        reducedMotion ? "" : "transition-transform duration-300 ease-out"
      } ${collapsed ? "-translate-y-full" : "translate-y-0"}`}
      style={{
        height,
        backgroundColor,
      }}
      role="region"
      aria-label="Store announcement"
      aria-hidden={collapsed}
    >
      {children}
    </div>
  );
}
