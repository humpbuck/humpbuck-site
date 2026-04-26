"use client";

import { useMemo, useState } from "react";

export function AffiliateLinkGenerator({
  pid,
  siteBaseUrl,
}: {
  pid: string;
  siteBaseUrl: string;
}) {
  const [rawUrl, setRawUrl] = useState("");

  const generated = useMemo(() => {
    const base = rawUrl.trim() || siteBaseUrl;
    try {
      const u = new URL(base);
      u.searchParams.set("pid", pid);
      return u.toString();
    } catch {
      return "";
    }
  }, [pid, rawUrl, siteBaseUrl]);

  return (
    <div className="space-y-3">
      <input
        value={rawUrl}
        onChange={(e) => setRawUrl(e.target.value)}
        placeholder={`${siteBaseUrl}/product/your-slug`}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
      />
      <textarea
        readOnly
        rows={3}
        value={generated || `Enter a valid URL to generate a PID link (${pid}).`}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-xs text-ink/90 outline-none"
      />
    </div>
  );
}

