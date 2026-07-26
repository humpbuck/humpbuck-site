"use client";

import type { ReactNode } from "react";
import { youtubeEmbedUrl } from "@/lib/blog-video";

function Frame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black">
        {children}
      </div>
    </div>
  );
}

function EmptySlot({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/70">
      {message}
    </div>
  );
}

export function VideoTutorialPlayers({
  r2VideoUrl,
  youtubeUrl,
  pageTitle,
  labels,
}: {
  r2VideoUrl: string;
  youtubeUrl: string;
  pageTitle: string;
  labels: {
    primaryR2: string;
    backupYoutube: string;
    emptyPrimary: string;
    emptyBackup: string;
  };
}) {
  const r2 = r2VideoUrl.trim();
  const yt = youtubeEmbedUrl(youtubeUrl);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-2 md:gap-8">
      <Frame label={labels.primaryR2}>
        {r2 ? (
          <video
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="metadata"
            // Helps mobile browsers offer native fullscreen (incl. landscape).
            controlsList="nodownload"
          >
            <source src={r2} />
          </video>
        ) : (
          <EmptySlot message={labels.emptyPrimary} />
        )}
      </Frame>
      <Frame label={labels.backupYoutube}>
        {yt ? (
          <iframe
            title={`${pageTitle} — YouTube`}
            src={yt}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <EmptySlot message={labels.emptyBackup} />
        )}
      </Frame>
    </div>
  );
}
