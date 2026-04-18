"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DIGI_HERO_VIDEO_SOURCES } from "@/lib/hero-space-video";

/**
 * Full-bleed muted loop for the DIGI-TEMP hero. Decorative — `aria-hidden`.
 * If every source fails, only the CSS layers remain (still “deep space” tone).
 */
export function HeroSpaceVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [videoDead, setVideoDead] = useState(false);

  const srcList = useMemo(() => {
    const seen = new Set<string>();
    return DIGI_HERO_VIDEO_SOURCES.filter((u) => {
      if (!u || seen.has(u)) return false;
      seen.add(u);
      return true;
    });
  }, []);

  const currentSrc = srcList[sourceIndex] ?? "";

  const tryNext = useCallback(() => {
    setSourceIndex((i) => {
      const next = i + 1;
      if (next < srcList.length) return next;
      setVideoDead(true);
      return i;
    });
  }, [srcList.length]);

  useEffect(() => {
    if (videoDead) return;
    const el = videoRef.current;
    if (!el || !currentSrc) {
      if (srcList.length === 0) setVideoDead(true);
      return;
    }
    el.load();
    const play = el.play();
    if (play) play.catch(() => tryNext());
  }, [currentSrc, srcList.length, tryNext, videoDead]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#070a10]">
      {/* Base: always on (accessibility / while video loads / if all sources fail) */}
      <div
        className="absolute inset-0 opacity-100"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 120% 90% at 25% 15%, rgb(34 211 238 / 0.16), transparent 52%),
            radial-gradient(ellipse 100% 80% at 85% 25%, rgb(99 102 241 / 0.12), transparent 48%),
            radial-gradient(circle at 50% 110%, rgb(2 6 23 / 0.95), rgb(7 10 16))
          `,
        }}
      />

      {!videoDead && currentSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 z-[1] h-full w-full object-cover opacity-[0.78] motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onError={tryNext}
        >
          <source src={currentSrc} type="video/mp4" />
        </video>
      ) : null}

      {/* Mood: vignette + cyan/purple haze (readability) */}
      <div
        className="absolute inset-0 z-[2] bg-gradient-to-b from-[#070a10]/60 via-[#070a10]/25 to-[#070a10]/90"
        aria-hidden
      />
      <div
        className="absolute inset-0 z-[2] opacity-[0.55]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgb(34 211 238 / 0.2), transparent 42%), radial-gradient(circle at 78% 12%, rgb(168 85 247 / 0.12), transparent 38%), linear-gradient(to bottom, rgb(7 10 16 / 0.65), rgb(15 17 20 / 0.35))",
        }}
      />
      {/* Fine grid — instrument / HUD undertone */}
      <div
        className="absolute inset-0 z-[2] opacity-[0.14] motion-reduce:opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden
      />
    </div>
  );
}
