import { R2, R2_GALLERY_SPECS_BY_SLUG, R2_PUBLIC_BASE } from "@/lib/r2";

type Spec = {
  slugFolder: string;
  filePrefix: string;
  variantFilePrefix?: string;
  variantSlug?: string;
};

async function ok(url: string): Promise<boolean> {
  try {
    let r = await fetch(url, { method: "HEAD" });
    if (r.ok) return true;
    if ([400, 403, 405].includes(r.status)) {
      r = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
      });
      return r.ok;
    }
    return false;
  } catch {
    return false;
  }
}

async function count(prefix: (n: number) => string, max: number) {
  const checks = await Promise.all(
    Array.from({ length: max }, (_, idx) => ok(prefix(idx + 1))),
  );
  let c = 0;
  const miss: number[] = [];
  for (let i = 0; i < checks.length; i += 1) {
    if (checks[i]) c += 1;
    else miss.push(i + 1);
  }
  return { count: c, miss };
}

function normalizeToken(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function main() {
  const map = R2_GALLERY_SPECS_BY_SLUG as Record<string, Spec>;
  const products = R2.products as Record<
    string,
    { gallery: string[]; detail: string[]; variants: string[] }
  >;

  for (const slug of Object.keys(map)) {
    const wanted = normalizeToken(slug);
    const staticKey = Object.keys(products).find(
      (k) => normalizeToken(k) === wanted,
    );
    const staticSet = staticKey ? products[staticKey] : null;
    if (!staticSet) {
      console.log(`${slug}\tNO_STATIC_ENTRY`);
      continue;
    }
    const spec = map[slug];
    const variantPrefix = spec.variantFilePrefix ?? spec.filePrefix;
    const variantMid = spec.variantSlug ?? "style";
    const g = await count(
      (i) =>
        `${R2_PUBLIC_BASE}/products/${spec.slugFolder}/gallery/${spec.filePrefix}-gallery-${String(i).padStart(2, "0")}.webp`,
      40,
    );
    const d = await count(
      (i) =>
        `${R2_PUBLIC_BASE}/products/${spec.slugFolder}/detail/${spec.filePrefix}-detail-${String(i).padStart(2, "0")}.webp`,
      80,
    );
    const v = await count(
      (i) =>
        `${R2_PUBLIC_BASE}/products/${spec.slugFolder}/variants/${variantPrefix}-${variantMid}-${String(i).padStart(2, "0")}.webp`,
      40,
    );

    const gs = staticSet.gallery.length;
    const ds = staticSet.detail.length;
    const vs = staticSet.variants.length;
    const mismatch = g.count !== gs || d.count !== ds || v.count !== vs;
    console.log(
      `${slug}\t${mismatch ? "MISMATCH" : "OK"}\tactual g/d/v=${g.count}/${d.count}/${v.count}\tstatic=${gs}/${ds}/${vs}`,
    );
    if (mismatch) {
      console.log(
        `  misses g:${g.miss.slice(0, 8).join(",")} d:${d.miss.slice(0, 8).join(",")} v:${v.miss.slice(0, 8).join(",")}`,
      );
    }
  }
}

void main();
