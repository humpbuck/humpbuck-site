/**
 * Fetches 30 Open Peeps–style PNGs (same seeds as the previous DiceBear URLs)
 * and uploads them to R2: Avatar/presets/open-peep-01.png … open-peep-30.png
 *
 * **Tone:** by default, `clothingColor` / `skinColor` / `headContrastColor` are
 * limited to grays (black‑and‑white). Set `AVATAR_PRESET_OPEN_PEEP_TONE=color`
 * to use DiceBear’s full color palette. True line‑art “Busts” from the official
 * site: https://www.openpeeps.com/ (CC0) — download PNG/SVG there if you need
 * those exact assets, then upload under `Avatar/presets/` (same filenames if
 * you replace the generated files).
 *
 * Requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * Load from .env / .env.local: run via npm script (see package.json)
 *
 * Usage: npm run r2:upload-avatar-presets
 */
import { createHash } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { isR2ReviewUploadConfigured } from "../lib/r2-review-upload";

loadEnvConfig(process.cwd());

const DICEBEAR = "https://api.dicebear.com/7.x/open-peeps/png";
const COUNT = 30;

function r2S3(): S3Client {
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

const GRAY_SKIN = "e8e8e8,d5d5d5,c2c2c2,afafaf,9c9c9c";
const GRAY_CLOTHING = "2a2a2a,3d3d3d,505050,636363,767676,898989,9c9c9c";
const GRAY_HAIR = "0a0a0a,1a1a1a,2a2a2a,3a3a3a,4a4a4a,5a5a5a,6a6a6a,7a7a7a,8a8a8a,9a9a9a";

function dicebearSourceUrl(i: number): string {
  const u = new URL(DICEBEAR);
  u.searchParams.set(
    "seed",
    `humpbuck-preset-${String(i + 1).padStart(2, "0")}`,
  );
  u.searchParams.set("size", "150");
  u.searchParams.set("backgroundColor", "ffffff");
  const tone = (
    process.env.AVATAR_PRESET_OPEN_PEEP_TONE ?? "gray"
  ).toLowerCase();
  if (tone !== "color") {
    u.searchParams.set("skinColor", GRAY_SKIN);
    u.searchParams.set("clothingColor", GRAY_CLOTHING);
    u.searchParams.set("headContrastColor", GRAY_HAIR);
  }
  return u.toString();
}

function objectKeyForIndex(i: number): string {
  return `Avatar/presets/open-peep-${String(i + 1).padStart(2, "0")}.png`;
}

async function main() {
  if (!isR2ReviewUploadConfigured()) {
    console.error("Missing R2 env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
    process.exit(1);
  }
  const bucket = process.env.R2_BUCKET_NAME!.trim();
  const client = r2S3();
  const tone = (process.env.AVATAR_PRESET_OPEN_PEEP_TONE ?? "gray").toLowerCase();
  console.log(
    `Open Peeps preset tone: ${tone === "color" ? "color" : "grayscale (set AVATAR_PRESET_OPEN_PEEP_TONE=color for full color)"}\n`,
  );

  for (let i = 0; i < COUNT; i++) {
    const key = objectKeyForIndex(i);
    const src = dicebearSourceUrl(i);
    const res = await fetch(src);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${key}: ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) {
      const sum = createHash("sha256").update(buf).digest("hex");
      throw new Error(`Response too small for ${key} (${buf.length} bytes), sha256=${sum}`);
    }
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentType: "image/png",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    console.log(`OK  ${key}  (${(buf.length / 1024).toFixed(1)} KiB)`);
  }

  console.log(
    "\nDone. Preset URLs in the app: {NEXT_PUBLIC_R2_PUBLIC_BASE or default}/Avatar/presets/open-peep-NN.png",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
