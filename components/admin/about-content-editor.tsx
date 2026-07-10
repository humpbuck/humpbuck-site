"use client";

import { useRef, useState } from "react";
import { PendingActionButton } from "@/components/admin/pending-action-button";

const FIELD =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/25";

const LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";

type Props = {
  initialHeading: string;
  initialParagraph1: string;
  initialImageAlt: string;
  initialImageUrl: string;
  defaultImageUrl: string;
};

export function AboutContentEditor({
  initialHeading,
  initialParagraph1,
  initialImageAlt,
  initialImageUrl,
  defaultImageUrl,
}: Props) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onUpload(file: File) {
    if (file.type !== "image/webp") {
      setUploadStatus("error");
      setUploadError("Please upload a WEBP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadStatus("error");
      setUploadError("Image must be 8 MB or smaller.");
      return;
    }

    setUploadStatus("loading");
    setUploadError("");

    try {
      const presign = await fetch("/api/admin/about/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          byteSize: file.size,
        }),
      });
      const payload = (await presign.json()) as {
        uploadUrl?: string;
        publicUrl?: string;
        error?: string;
      };
      if (!presign.ok || !payload.uploadUrl || !payload.publicUrl) {
        throw new Error(payload.error || "Failed to get upload URL.");
      }

      const put = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        throw new Error("Upload to R2 failed.");
      }

      setImageUrl(payload.publicUrl);
      setUploadStatus("idle");
    } catch (error) {
      setUploadStatus("error");
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  const previewUrl = imageUrl.trim() || defaultImageUrl;

  return (
    <div className="space-y-5">
      <label className="block">
        <span className={LABEL}>Heading</span>
        <input
          name="aboutHeading"
          type="text"
          defaultValue={initialHeading}
          placeholder="About"
          className={FIELD}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Story text</span>
        <textarea
          name="aboutParagraph1"
          rows={8}
          defaultValue={initialParagraph1}
          placeholder="Growing up, I watched my father—a master watch repairman…"
          className={`${FIELD} min-h-[10rem] resize-y`}
        />
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
          Shown on the homepage founder section and the About page (left image, right text).
        </p>
      </label>

      <label className="block">
        <span className={LABEL}>Image alt text</span>
        <input
          name="aboutImageAlt"
          type="text"
          defaultValue={initialImageAlt}
          placeholder="Founder story — watch repair workshop"
          className={FIELD}
        />
      </label>

      <div>
        <span className={LABEL}>Founder image</span>
        <div className="mt-1.5 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative aspect-4/5 w-full max-w-48 shrink-0 overflow-hidden rounded-2xl border border-line bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <input
              name="aboutImageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={defaultImageUrl}
              className={FIELD}
            />
            <p className="text-[11px] leading-relaxed text-muted">
              Paste an R2 or HTTPS URL, or upload WEBP to{" "}
              <code className="text-[10px]">Home/about-founder.webp</code>. Default:{" "}
              {defaultImageUrl}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUpload(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={uploadStatus === "loading"}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition hover:border-ink/20 disabled:opacity-60"
              >
                {uploadStatus === "loading" ? "Uploading…" : "Upload WEBP to R2"}
              </button>
              {imageUrl.trim() ? (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-[11px] font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
                >
                  Clear URL (use default)
                </button>
              ) : null}
            </div>
            {uploadError ? (
              <p className="text-[11px] text-rose-700">{uploadError}</p>
            ) : null}
          </div>
        </div>
      </div>

      <PendingActionButton
        idleLabel="Save About section"
        pendingLabel="Saving…"
        className="inline-flex items-center justify-center rounded-xl bg-ink px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-ink/90"
      />
    </div>
  );
}
