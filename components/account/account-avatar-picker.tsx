"use client";

import imageCompression from "browser-image-compression";
import Image from "next/image";
import { PresetAvatarImage } from "@/components/account/preset-avatar-image";
import { useRouter } from "@/i18n/navigation";
import { shouldUnoptimizeAvatarUrl } from "@/lib/avatar-cdn";
import { BUYER_AVATAR_PRESET_URLS } from "@/lib/avatar-presets";
import { useTranslations } from "next-intl";
import { getSession } from "next-auth/react";
import { useState } from "react";

type Props = {
  initialImage: string | null;
};

export function AccountAvatarPicker({ initialImage }: Props) {
  const router = useRouter();
  const t = useTranslations("Account");
  const [image, setImage] = useState<string | null>(initialImage);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function patchImage(next: string | null) {
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("avatarErrUpdate"));
      setImage(next);
      setOk(next ? t("avatarOkUpdated") : t("avatarOkRemoved"));
      router.refresh();
      await getSession();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("profileGenericError"));
    } finally {
      setBusy(false);
    }
  }

  async function onPickPreset(url: string) {
    if (busy || url === image) return;
    await patchImage(url);
  }

  async function onRemove() {
    if (busy) return;
    await patchImage(null);
  }

  async function onFile(file: File | null) {
    if (!file || busy) return;
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      const blob: Blob = await imageCompression(file, {
        maxSizeMB: 0.45,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: "image/webp",
      });
      const out =
        blob instanceof File ? blob : new Blob([blob], { type: "image/webp" });
      if (out.size > 600 * 1024) {
        throw new Error(t("avatarErrTooLarge"));
      }

      const pre = await fetch("/api/account/avatar/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "image/webp",
          byteSize: out.size,
        }),
      });
      if (!pre.ok) {
        const j = (await pre.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || t("avatarErrPresign"));
      }
      const { uploadUrl, publicUrl } = (await pre.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: out,
        headers: { "Content-Type": "image/webp" },
      });
      if (!put.ok) throw new Error(t("avatarErrUpload"));

      const save = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: publicUrl }),
      });
      const saveData = (await save.json()) as { error?: string };
      if (!save.ok) throw new Error(saveData.error || t("avatarErrSave"));

      setImage(publicUrl);
      setOk(t("avatarOkUpdated"));
      router.refresh();
      await getSession();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("profileGenericError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-paper/60 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/85">
        {t("avatarTitle")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        {t.rich("avatarIntro", {
          gravatar: (chunks) => (
            <strong className="font-medium text-ink/90">{chunks}</strong>
          ),
          code: (chunks) => (
            <code className="rounded bg-paper px-1 text-xs">{chunks}</code>
          ),
        })}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-[color:var(--color-line)]">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={shouldUnoptimizeAvatarUrl(image)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-ink/45">
              ?
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex cursor-pointer">
            <span className="rounded-xl border border-line bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition hover:border-ink/25">
              {busy ? t("avatarWorking") : t("avatarUpload")}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                void onFile(f ?? null);
              }}
            />
          </label>
          {image ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onRemove()}
              className="text-left text-xs font-semibold text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
            >
              {t("avatarRemove")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {t("avatarBuiltInHeading")}
        </p>
        <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
          {BUYER_AVATAR_PRESET_URLS.map((url) => (
            <button
              key={url}
              type="button"
              disabled={busy}
              onClick={() => void onPickPreset(url)}
              className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 transition ${
                image === url
                  ? "ring-ink"
                  : "ring-transparent hover:ring-ink/30"
              } disabled:opacity-50`}
              aria-label={t("avatarChooseBuiltinAria")}
            >
              <PresetAvatarImage src={url} sizes="48px" />
            </button>
          ))}
        </div>
      </div>

      {err ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 text-sm text-green-800" role="status">
          {ok}
        </p>
      ) : null}
    </section>
  );
}
