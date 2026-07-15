"use client";

import { StorefrontImage } from "@/components/site/storefront-image";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type OemInquiryProductOption = {
  slug: string;
  name: string;
  image: string;
  specs: { label: string; value: string }[];
  oemOdmPrice?: number;
};

type CustomizationKey = "dial" | "caseBack" | "buckle" | "crown";

type Status = "idle" | "uploading" | "loading" | "success" | "error";

const FIELD =
  "mt-1.5 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15";

const LABEL =
  "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";

const CUSTOMIZATION_OPTIONS: CustomizationKey[] = [
  "dial",
  "caseBack",
  "buckle",
  "crown",
];

function createInquiryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.slice(0, 32);
}

function formatOemPrice(price: number | undefined, inquiryLabel: string): string {
  if (price != null && price > 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  }
  return inquiryLabel;
}

function filterInquiryProducts(
  products: OemInquiryProductOption[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
  );
}

function OemInquiryProductPicker({
  products,
  value,
  onChange,
  placeholder,
  groupLabel,
  searchPlaceholder,
}: {
  products: OemInquiryProductOption[];
  value: string;
  onChange: (slug: string) => void;
  placeholder: string;
  groupLabel: string;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = "oem-inquiry-product-listbox";

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );
  const filteredProducts = useMemo(
    () => filterInquiryProducts(sortedProducts, search),
    [sortedProducts, search],
  );
  const selected = products.find((p) => p.slug === value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function selectProduct(slug: string) {
    onChange(slug);
    setOpen(false);
    setSearch("");
  }

  function renderOption(product: OemInquiryProductOption) {
    const isSelected = product.slug === value;
    return (
      <button
        key={product.slug}
        type="button"
        role="option"
        aria-selected={isSelected}
        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-paper ${
          isSelected ? "bg-paper/80 font-semibold text-ink" : "text-ink"
        }`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => selectProduct(product.slug)}
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-line/80 bg-paper">
          {product.image ? (
            <StorefrontImage
              src={product.image}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : null}
        </div>
        <span className="min-w-0 flex-1 truncate">{product.name}</span>
        {isSelected ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-ink" strokeWidth={2.5} aria-hidden />
        ) : null}
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className={`${FIELD} flex items-center justify-between gap-3 text-left`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {selected?.image ? (
            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-line/80 bg-paper">
              <StorefrontImage
                src={selected.image}
                alt=""
                fill
                sizes="28px"
                className="object-cover"
              />
            </span>
          ) : null}
          <span
            className={`truncate ${selected ? "text-ink" : "text-muted"}`}
          >
            {selected?.name ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-lg"
        >
          <div className="border-b border-line/80 p-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none ring-ink/15 focus:ring-2"
              autoComplete="off"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredProducts.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted">—</p>
            ) : (
              <div>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {groupLabel}
                </p>
                {filteredProducts.map(renderOption)}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OemInquiryForm({
  products,
}: {
  products: OemInquiryProductOption[];
}) {
  const t = useTranslations("OemOdmPage");
  const locale = useLocale();
  const pathname = usePathname();

  const [inquiryId] = useState(createInquiryId);
  const [productSlug, setProductSlug] = useState("");
  const [customizations, setCustomizations] = useState<CustomizationKey[]>([]);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoKey, setLogoKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const selected = useMemo(
    () => products.find((p) => p.slug === productSlug),
    [products, productSlug],
  );

  useEffect(() => {
    queueMicrotask(() => {
      setPageUrl(
        `${window.location.origin}${pathname}${window.location.search}`,
      );
    });
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  function toggleCustomization(key: CustomizationKey) {
    setCustomizations((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function onLogoChange(file: File | null) {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoUrl("");
    setLogoKey("");
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function uploadLogo(file: File): Promise<{ publicUrl: string; key: string }> {
    const contentType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const presignRes = await fetch("/api/oem-inquiry/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiryId,
        contentType,
        byteSize: file.size,
      }),
    });
    const presignData = (await presignRes.json().catch(() => ({}))) as {
      uploadUrl?: string;
      publicUrl?: string;
      key?: string;
      error?: string;
    };
    if (!presignRes.ok || !presignData.uploadUrl || !presignData.publicUrl || !presignData.key) {
      throw new Error(presignData.error ?? t("inquiryErrUpload"));
    }
    const putRes = await fetch(presignData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(t("inquiryErrUpload"));
    }
    return { publicUrl: presignData.publicUrl, key: presignData.key };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "uploading") return;

    setErrorMessage("");

    if (!productSlug) {
      setErrorMessage(t("inquiryErrProductRequired"));
      setStatus("error");
      return;
    }

    if (!logoFile && !logoUrl) {
      setErrorMessage(t("inquiryErrLogoRequired"));
      return;
    }

    try {
      let finalLogoUrl = logoUrl;
      let finalLogoKey = logoKey;

      if (logoFile && !finalLogoUrl) {
        setStatus("uploading");
        const uploaded = await uploadLogo(logoFile);
        finalLogoUrl = uploaded.publicUrl;
        finalLogoKey = uploaded.key;
        setLogoUrl(finalLogoUrl);
        setLogoKey(finalLogoKey);
      }

      setStatus("loading");
      const res = await fetch("/api/oem-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          productSlug,
          customizations,
          logoUrl: finalLogoUrl,
          logoKey: finalLogoKey,
          inquiryId,
          notes,
          pageUrl,
          locale,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && data.ok) {
        setStatus("success");
        return;
      }
      setStatus("error");
      setErrorMessage(data.error ?? t("inquiryErrSubmit"));
    } catch {
      setStatus("error");
      setErrorMessage(t("inquiryErrNetwork"));
    }
  }

  if (status === "success") {
    return (
      <div className="py-2 text-center sm:text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {t("inquirySuccessKicker")}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/85">
          {t("inquirySuccessBody")}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div>
        <span className={LABEL}>
          {t("inquiryLabelProduct")}{" "}
          <span className="text-rose-600" aria-hidden="true">
            *
          </span>
        </span>
        <OemInquiryProductPicker
          products={products}
          value={productSlug}
          onChange={setProductSlug}
          placeholder={t("inquiryProductPlaceholder")}
          groupLabel={t("inquiryProductAllGroup")}
          searchPlaceholder={t("inquiryProductSearchPlaceholder")}
        />
      </div>

      {selected ? (
        <div className="rounded-2xl border border-line/80 bg-paper/60 p-4">
          <div className="flex gap-4">
            {selected.image ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
                <StorefrontImage
                  src={selected.image}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-ink">{selected.name}</p>
              <dl className="mt-2 grid gap-1.5 text-muted">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-ink/80">{t("inquiryLabelUnitPrice")}</dt>
                  <dd>
                    {formatOemPrice(selected.oemOdmPrice, t("inquiryPriceInquiry"))}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-ink/80">{t("inquiryLabelMoq")}</dt>
                  <dd>{t("inquiryMoqValue")}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-ink/80">{t("inquiryLabelLeadTime")}</dt>
                  <dd>{t("inquiryLeadTimeValue")}</dd>
                </div>
              </dl>
              <Link
                href={`/product/${selected.slug}`}
                className="mt-2 inline-block text-xs font-semibold text-digital-dim underline-offset-2 hover:underline"
              >
                {t("inquiryViewProduct")}
              </Link>
            </div>
          </div>
          {selected.specs.length > 0 ? (
            <dl className="mt-4 grid gap-2 border-t border-line/70 pt-4 sm:grid-cols-2">
              {selected.specs
                .filter((s) => s.label && s.value)
                .slice(0, 8)
                .map((spec) => (
                  <div key={spec.label} className="text-xs">
                    <dt className="font-semibold uppercase tracking-[0.08em] text-muted">
                      {spec.label}
                    </dt>
                    <dd className="mt-0.5 text-ink">{spec.value}</dd>
                  </div>
                ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      <fieldset>
        <legend className={LABEL}>
          {t("inquiryLabelCustomizations")}{" "}
          <span className="text-rose-600" aria-hidden="true">
            *
          </span>
        </legend>
        <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
          {CUSTOMIZATION_OPTIONS.map((key) => {
            const checked = customizations.includes(key);
            return (
              <label
                key={key}
                className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border px-1.5 py-1.5 text-[11px] transition sm:gap-2 sm:px-2.5 sm:py-1.5 sm:text-xs ${
                  checked
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white/70 text-ink hover:border-ink/30"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleCustomization(key)}
                />
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                    checked
                      ? "border-paper/70 bg-paper text-ink"
                      : "border-line bg-white"
                  }`}
                  aria-hidden
                >
                  {checked ? (
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  ) : null}
                </span>
                <span className="whitespace-nowrap">{t(`inquiryCustomization_${key}`)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <span className={LABEL}>
          {t("inquiryLabelLogo")}{" "}
          <span className="text-rose-600" aria-hidden="true">
            *
          </span>
        </span>
        <p className="mt-1 text-xs text-muted">{t("inquiryLogoHint")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30">
            {logoFile ? t("inquiryLogoChange") : t("inquiryLogoUpload")}
            <input
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview}
              alt=""
              className="h-12 w-12 rounded-lg border border-line object-contain bg-white"
            />
          ) : null}
        </div>
      </div>

      <label>
        <span className={LABEL}>
          {t("inquiryLabelEmail")}{" "}
          <span className="text-rose-600" aria-hidden="true">
            *
          </span>
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
        />
      </label>

      <label>
        <span className={LABEL}>{t("inquiryLabelNotes")}</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={FIELD}
          maxLength={2000}
          placeholder={t("inquiryNotesPlaceholder")}
        />
      </label>

      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] top-auto h-px w-px opacity-0"
        aria-hidden="true"
      />

      <div className="flex justify-end border-t border-line/70 pt-4">
        <button
          type="submit"
          disabled={status === "loading" || status === "uploading"}
          className="rounded-full bg-ink px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-60"
        >
          {status === "uploading"
            ? t("inquiryUploading")
            : status === "loading"
              ? t("inquirySubmitting")
              : t("inquirySubmit")}
        </button>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-600/90" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
