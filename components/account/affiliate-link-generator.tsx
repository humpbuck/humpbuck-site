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
  const [generated, setGenerated] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");

  const preview = useMemo(() => {
    const base = rawUrl.trim() || siteBaseUrl;
    try {
      const u = new URL(base);
      u.searchParams.set("pid", pid);
      return u.toString();
    } catch {
      return "";
    }
  }, [pid, rawUrl, siteBaseUrl]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("done");
      setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1600);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          value={rawUrl}
          onChange={(e) => setRawUrl(e.target.value)}
          placeholder={`${siteBaseUrl}/product/your-slug`}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none ring-ink/20 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => {
            setGenerated(preview);
            if (preview) {
              void copy(preview);
            }
          }}
          disabled={!preview}
          className="inline-flex items-center justify-center rounded-xl bg-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate & Copy
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <input
          readOnly
          value={generated || ""}
          placeholder={`Generated tracking link will appear here (PID: ${pid})`}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-xs text-ink/90 outline-none"
        />
        <button
          type="button"
          onClick={() => generated && void copy(generated)}
          disabled={!generated}
          className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/20 disabled:cursor-not-allowed disabled:opacity-50"
          title="Copy generated link"
        >
          {copyState === "done" ? "Copied" : copyState === "error" ? "Copy failed" : "Copy"}
        </button>
      </div>
      {copyState === "done" ? (
        <p className="text-xs text-emerald-700">Copy successful.</p>
      ) : copyState === "error" ? (
        <p className="text-xs text-rose-700">Copy failed. Please try again.</p>
      ) : null}
    </div>
  );
}

