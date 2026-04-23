"use client";

import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";

type Props = {
  orderId: string;
  productSlug: string;
  productName: string;
};

export function ProductReviewForm({
  orderId,
  productSlug,
  productName,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [thanksOpen, setThanksOpen] = useState(false);

  function closeThanksAndGoToProduct() {
    setThanksOpen(false);
    router.push(`/product/${productSlug}`);
    router.refresh();
  }

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
            orderId,
            productSlug,
            contentType: "image/webp",
            byteSize: blob.size,
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
            const err = (await put.json().catch(() => ({}))) as { error?: string };
            throw new Error(err.error || "Image upload failed");
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

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          productSlug,
          rating,
          body: body.trim(),
          imageUrls,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Could not save review");
      }
      router.refresh();
      setThanksOpen(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {thanksOpen ? (
        <CenterModal title="Thank you" onClose={closeThanksAndGoToProduct}>
          <p className="text-sm leading-relaxed text-ink/90">
            Thanks for your review! We&apos;ll keep improving and hope to see you
            again soon.
          </p>
        </CenterModal>
      ) : null}

    <form onSubmit={submit} className="space-y-6">
      <p className="text-sm text-muted">
        Photos are compressed to WebP in your browser before upload. Up to 4 images
        · max ~2 MB each after compression.
      </p>

      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Rating
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold tabular-nums transition ${
                rating >= n
                  ? "bg-ink text-paper"
                  : "border border-line bg-paper text-muted"
              }`}
              aria-label={`${n} stars`}
            >
              {n}★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-body"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
        >
          Your review ({productName})
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={2000}
          required
          className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/15"
          placeholder="Quality, fit, shipping experience…"
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
        {files.length > 0 ? (
          <p className="mt-1 text-xs text-muted">{files.length} file(s) selected</p>
        ) : null}
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
          {busy ? "Submitting…" : "Submit review"}
        </button>
        <Link
          href={`/account/orders/${orderId}`}
          className="inline-flex items-center rounded-full border border-line px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/80"
        >
          Cancel
        </Link>
      </div>
    </form>
    </>
  );
}
