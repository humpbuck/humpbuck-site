import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import type { ProductVariantOption } from "@/lib/catalog";
import { R2_GALLERY_SPECS_BY_SLUG, R2_PUBLIC_BASE, type R2GallerySpec } from "@/lib/r2";
import { isR2ReviewUploadConfigured } from "@/lib/r2-review-upload";
import {
  getDiscoveredDetailUrls,
  getDiscoveredGalleryUrls,
  getDiscoveredVariantUrls,
  headOk,
} from "@/lib/r2-discover-gallery";

export type PdpR2Media = {
  /** Resolved URLs; `null` means use static catalog for that section. */
  gallery: string[] | null;
  detail: string[] | null;
  variants: string[] | null;
  /** All `.mp4` under `products/{slug}/video/`, sorted by file name. */
  videos: string[] | null;
};

function r2PublicBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return R2_PUBLIC_BASE.replace(/\/$/, "");
}

function keyToPublicUrl(key: string): string {
  const segs = key.split("/").map((p) => encodeURIComponent(p));
  return `${r2PublicBase()}/${segs.join("/")}`;
}

function sortKeysByFileName(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const fa = a.split("/").pop() ?? a;
    const fb = b.split("/").pop() ?? b;
    return fa.localeCompare(fb, undefined, { numeric: true, sensitivity: "base" });
  });
}

function r2S3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

async function listObjectKeys(
  client: S3Client,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const o of res.Contents ?? []) {
      if (o.Key && !o.Key.endsWith("/")) keys.push(o.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

function filterWebp(keys: string[]): string[] {
  return keys.filter((k) => k.toLowerCase().endsWith(".webp"));
}

function filterMp4(keys: string[]): string[] {
  return keys.filter((k) => k.toLowerCase().endsWith(".mp4"));
}

/** Same credentials as presigned review/avatar upload — lists actual keys in the bucket. */
function canListR2(): boolean {
  return isR2ReviewUploadConfigured();
}

/** Loose uploads directly under `products/{slugFolder}/*.webp` (not in `gallery/`). */
async function listRootProductWebpUrls(spec: R2GallerySpec): Promise<string[]> {
  if (!canListR2()) return [];
  try {
    const client = r2S3Client();
    const bucket = process.env.R2_BUCKET_NAME!.trim();
    const prefix = `products/${spec.slugFolder}/`;
    const raw = await listObjectKeys(client, bucket, prefix);
    const rootWebp = filterWebp(raw).filter((k) => {
      const rel = k.slice(prefix.length);
      return rel.length > 0 && !rel.includes("/");
    });
    return sortKeysByFileName(rootWebp).map(keyToPublicUrl);
  } catch {
    return [];
  }
}

async function listWebpFolderUrls(
  spec: R2GallerySpec,
  sub: "gallery" | "detail" | "variants",
): Promise<string[]> {
  if (!canListR2()) return [];
  try {
    const client = r2S3Client();
    const bucket = process.env.R2_BUCKET_NAME!.trim();
    const prefix = `products/${spec.slugFolder}/${sub}/`;
    const raw = await listObjectKeys(client, bucket, prefix);
    const webp = filterWebp(raw);
    return sortKeysByFileName(webp).map(keyToPublicUrl);
  } catch {
    return [];
  }
}

async function listVideoFolderUrls(spec: R2GallerySpec): Promise<string[]> {
  if (!canListR2()) return [];
  try {
    const client = r2S3Client();
    const bucket = process.env.R2_BUCKET_NAME!.trim();
    const prefix = `products/${spec.slugFolder}/video/`;
    const raw = await listObjectKeys(client, bucket, prefix);
    const mp4 = filterMp4(raw);
    const canonicalBase = `${spec.filePrefix}-video.mp4`.toLowerCase();
    const canonical = mp4.find(
      (k) => (k.split("/").pop() ?? "").toLowerCase() === canonicalBase,
    );
    if (canonical) return [keyToPublicUrl(canonical)];
    return sortKeysByFileName(mp4).map(keyToPublicUrl);
  } catch {
    return [];
  }
}

async function discoverVideosByHead(
  spec: R2GallerySpec,
): Promise<string[] | null> {
  if (process.env.R2_GALLERY_DISCOVER === "0") return null;
  const u = `${r2PublicBase()}/products/${spec.slugFolder}/video/${spec.filePrefix}-video.mp4`;
  if (await headOk(u)) return [u];
  return null;
}

/**
 * Resolves gallery / detail / variant stills and showcase video URLs from R2.
 * When R2 **API** credentials are set, uses `ListObjects` (true bucket sync, any count, gaps in numbering allowed).
 * Otherwise uses cached HEAD-based indexed discovery in `r2-discover-gallery.ts` (or catalog fallback in the page).
 */
async function getPdpR2MediaImpl(spec: R2GallerySpec): Promise<PdpR2Media> {
  const [listGallery, listDetail, listVariants, listVideos] = canListR2()
    ? await Promise.all([
        listWebpFolderUrls(spec, "gallery"),
        listWebpFolderUrls(spec, "detail"),
        listWebpFolderUrls(spec, "variants"),
        listVideoFolderUrls(spec),
      ])
    : [[], [], [], []];

  let gallery: string[] | null =
    listGallery.length > 0 ? listGallery : await getDiscoveredGalleryUrls(spec);
  if (!gallery?.length) {
    const root = await listRootProductWebpUrls(spec);
    if (root.length > 0) gallery = root;
  }
  const detail =
    listDetail.length > 0 ? listDetail : await getDiscoveredDetailUrls(spec);
  const variants =
    listVariants.length > 0 ? listVariants : await getDiscoveredVariantUrls(spec);
  const videos =
    listVideos.length > 0 ? listVideos : await discoverVideosByHead(spec);

  return { gallery, detail, variants, videos };
}

export type CatalogProductMediaInput = {
  slug: string;
  image?: string;
  gallery?: string[];
  detail?: string[];
  variants?: ProductVariantOption[];
  promoVideo?: { src?: string; poster?: string } | null;
};

export type ResolvedStorefrontProductMedia = {
  gallery: string[];
  detail: string[];
  variantOptions: ProductVariantOption[];
  promoVideos: { src: string; poster?: string }[] | null;
};

function trimUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.map((u) => u.trim()).filter(Boolean);
}

/**
 * Storefront PDP media: **admin URLs win** (`galleryJson`, `detailJson`, `variantsJson`,
 * `promoVideoJson`). R2 bucket discovery only fills sections left empty in the catalog.
 */
export async function resolveStorefrontProductMedia(
  catalog: CatalogProductMediaInput,
): Promise<ResolvedStorefrontProductMedia> {
  const galleryAdmin = trimUrls(catalog.gallery);
  const detailAdmin = trimUrls(catalog.detail);
  const catalogVariants = catalog.variants ?? [];

  const spec = R2_GALLERY_SPECS_BY_SLUG[catalog.slug];
  const r2 = spec ? await getPdpR2Media(spec) : null;

  const gallery =
    galleryAdmin.length > 0
      ? galleryAdmin
      : r2?.gallery?.length
        ? r2.gallery
        : catalog.image?.trim()
          ? [catalog.image.trim()]
          : [];

  const detail =
    detailAdmin.length > 0 ? detailAdmin : r2?.detail?.length ? r2.detail : [];

  let variantOptions = catalogVariants;
  if (catalogVariants.length > 0 && r2?.variants?.length) {
    variantOptions = catalogVariants.map((v, i) => ({
      ...v,
      image: v.image?.trim() || r2.variants![i] || v.image,
    }));
  }

  const poster = gallery[0] ?? catalog.image?.trim();
  const promoSrc = catalog.promoVideo?.src?.trim();
  let promoVideos: { src: string; poster?: string }[] | null = null;
  if (promoSrc) {
    promoVideos = [
      {
        src: promoSrc,
        poster: catalog.promoVideo?.poster?.trim() || poster,
      },
    ];
  } else if (r2?.videos?.length) {
    promoVideos = r2.videos.map((src) => ({ src, poster }));
  }

  return { gallery, detail, variantOptions, promoVideos };
}

export async function getPdpR2Media(spec: R2GallerySpec): Promise<PdpR2Media> {
  const run = unstable_cache(
    async () => getPdpR2MediaImpl(spec),
    [
      "pdp-r2",
      spec.slugFolder,
      spec.filePrefix,
      spec.variantFilePrefix ?? "",
      spec.variantSlug ?? "",
    ],
    { revalidate: 300 },
  );
  return run();
}
