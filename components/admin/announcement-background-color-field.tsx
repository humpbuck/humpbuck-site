"use client";

import { useState } from "react";
import {
  announcementBarTextColor,
  DEFAULT_ANNOUNCEMENT_BACKGROUND,
  normalizeAnnouncementBackgroundColor,
} from "@/lib/site-announcement";

export function AnnouncementBackgroundColorField({
  defaultValue,
}: {
  defaultValue: string;
}) {
  const initial =
    normalizeAnnouncementBackgroundColor(defaultValue) ?? DEFAULT_ANNOUNCEMENT_BACKGROUND;
  const [color, setColor] = useState(initial);
  const previewTextColor = announcementBarTextColor(color);

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Pick bar color"
          className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-white p-1"
        />
        <input
          name="backgroundColor"
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#0f1114"
          spellCheck={false}
          className="min-w-[8rem] flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 font-mono text-sm text-ink outline-none ring-ink/20 focus:ring-2 sm:max-w-[10rem]"
        />
      </div>
      <div
        className="rounded-xl px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px]"
        style={{ backgroundColor: color, color: previewTextColor }}
        aria-hidden
      >
        Preview — bar background &amp; text contrast
      </div>
    </div>
  );
}
