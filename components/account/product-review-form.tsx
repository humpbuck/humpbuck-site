"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CenterModal } from "@/components/ui/center-modal";
import { ReviewEmojiPicker } from "@/components/reviews/review-emoji-picker";
import { compressReviewImageToWebP } from "@/lib/review-image-compress-webp";

type Props = {
  productSlug: string;
  productName: string;
  cancelHref: string;
  orderId?: string;
  /** On product page: hide cancel, stay on page after thanks. */
  embedded?: boolean;
  /** Called after a successful submit (embedded / modal flows). */
  onSuccess?: () => void;
};

export function ProductReviewForm({
  productSlug,
  productName,
  cancelHref,
  orderId,
  embedded = false,
  onSuccess,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("AccountReview");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [thanksOpen, setThanksOpen] = useState(false);

  function appendEmoji(emoji: string) {
    setBody((prev) => {
      const next = `${prev}${emoji}`;
      return next.length > 2000 ? prev : next;
    });
  }

  function closeThanksAndGoToProduct() {
    setThanksOpen(false);
    if (embedded) {
      onSuccess?.();
      return;
    }
    router.push(`/product/${productSlug}`);
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!session?.user?.id) {
      router.push(
        `/auth/login?callbackUrl=${encodeURIComponent(`/product/${productSlug}#buyer-reviews`)}`,
      );
      return;
    }

    setBusy(true);
    try {
      const imageUrls: string[] = [];
      const slice = files.slice(0, 4);
      for (const file of slice) {
        const blob = await compressReviewImageToWebP(file);

        const pre = await fetch("/api/reviews/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(orderId ? { orderId } : {}),
            productSlug,
            contentType: "image/webp",
            byteSize: blob.size,
          }),
        });
        if (!pre.ok) {
          const j = (await pre.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || t("errGeneric"));
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
            const putErr = (await put.json().catch(() => ({}))) as { error?: string };
            throw new Error(putErr.error || t("errGeneric"));
          }
          const data = (await put.json().catch(() => ({}))) as { publicUrl?: string };
          imageUrls.push((data.publicUrl || j.publicUrl) as string);
        } else if (j.uploadUrl) {
          const put = await fetch(j.uploadUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "image/webp" },
          });
          if (!put.ok) throw new Error(t("errGeneric"));
          imageUrls.push(j.publicUrl);
        } else {
          throw new Error(t("errGeneric"));
        }
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(orderId ? { orderId } : {}),
          productSlug,
          rating,
          body: body.trim(),
          imageUrls,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || t("errGeneric"));
      }
      setThanksOpen(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {thanksOpen ? (
        <CenterModal
          title={t("thanksTitle")}
          onClose={closeThanksAndGoToProduct}
          layer="elevated"
        >
          <p className="text-sm leading-relaxed text-ink/90">{t("thanksPendingBody")}</p>
        </CenterModal>
      ) : null}

      <form onSubmit={submit} className="space-y-6">
        <div
          className="flex gap-0.5"
          role="radiogroup"
          aria-label={t("ratingLabel")}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              onClick={() => setRating(n)}
              className={`px-0.5 text-lg leading-none transition ${
                rating >= n ? "text-amber-500" : "text-ink/20"
              }`}
              aria-label={t("starsAria", { n })}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <div className="relative">
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={2000}
              required
              className="block w-full resize-y rounded-xl border border-line bg-paper px-4 pb-10 pt-3 pr-11 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/15"
              placeholder={t("bodyPlaceholder")}
            />
            <ReviewEmojiPicker
              variant="popover"
              label={t("emojiLabel")}
              onPick={appendEmoji}
            />
          </div>
          <p className="mt-1 text-xs text-muted tabular-nums">{body.length}/2000</p>
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("photosOptional")}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-2 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-paper file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 4))}
          />
          {files.length > 0 ? (
            <p className="mt-1 text-xs text-muted">{t("filesSelected", { count: files.length })}</p>
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
            {busy ? t("submitting") : t("submitReview")}
          </button>
          {!embedded ? (
            <Link
              href={cancelHref}
              className="inline-flex items-center rounded-full border border-line px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/80"
            >
              {t("cancel")}
            </Link>
          ) : null}
        </div>
      </form>
    </>
  );
}
