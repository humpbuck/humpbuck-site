"use client";

import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  reviewId: string;
  productSlug: string;
  productName: string;
};

export function ReviewAppendForm({ reviewId, productSlug, productName }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const imageUrls: string[] = [];
      const slice = files.slice(0, 4);
      for (const file of slice) {
        const out = await imageCompression(file, {
          maxSizeMB: 1.2,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: "image/webp",
        });
        const blob: Blob =
          out instanceof File ? out : new Blob([out], { type: "image/webp" });

        const pre = await fetch("/api/reviews/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productSlug,
            contentType: "image/webp",
            byteSize: blob.size,
            appendReviewId: reviewId,
          }),
        });
        if (!pre.ok) {
          const j = (await pre.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || "Could not prepare upload");
        }
        const j = (await pre.json()) as {
          uploadUrl?: string;
          publicUrl: string;
          useLocalUpload?: boolean;
          putUrl?: string;
        };
        if (j.useLocalUpload && j.putUrl) {
          const put = await fetch(j.putUrl, {
            method: "POST",
            body: blob,
            headers: { "Content-Type": "image/webp" },
            credentials: "include",
          });
          if (!put.ok) {
            const errJ = (await put.json().catch(() => ({}))) as { error?: string };
            throw new Error(errJ.error || "Image upload failed");
          }
          const data = (await put.json().catch(() => ({}))) as { publicUrl?: string };
          imageUrls.push((data.publicUrl || j.publicUrl) as string);
        } else if (j.uploadUrl) {
          const put = await fetch(j.uploadUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "image/webp" },
          });
          if (!put.ok) throw new Error("Image upload failed");
          imageUrls.push(j.publicUrl);
        } else {
          throw new Error("Could not prepare upload");
        }
      }

      const res = await fetch("/api/reviews/append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, body: body.trim(), imageUrls }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not save follow-up");
      }
      router.push(`/product/${productSlug}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <p className="text-sm text-muted">
        Optional photos are compressed to WebP before upload. Up to 4 images, max
        ~2 MB each.
      </p>
      <div>
        <label
          htmlFor="append-body"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
        >
          Your follow-up ({productName})
        </label>
        <textarea
          id="append-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={2000}
          required
          className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/15"
          placeholder="Additional thoughts after more use, shipping, support…"
        />
        <p className="mt-1 text-xs text-muted tabular-nums">{body.length}/2000</p>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Photos (optional)
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          onChange={(e) =>
            setFiles(Array.from(e.target.files ?? []).slice(0, 4))
          }
        />
      </div>
      {err ? (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="rounded-full bg-ink px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-paper disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Post follow-up"}
        </button>
        <Link
          href={`/product/${productSlug}`}
          className="inline-flex items-center rounded-full border border-line px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/80"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
