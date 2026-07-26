/**
 * Remove long Cache-Control from product objects in R2 (align with watchsourcego).
 * Copies each key onto itself with metadata REPLACE and no Cache-Control header.
 *
 * Usage:
 *   node scripts/r2-strip-product-cache-control.mjs
 *   node scripts/r2-strip-product-cache-control.mjs --prefix Products/MITINA/Fastrack/
 *   node scripts/r2-strip-product-cache-control.mjs --dry-run
 *
 * Needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 * (loads `.env` / `.env.local` via scripts/load-project-env.mjs).
 */
import { createRequire } from "node:module";
import { AwsClient } from "aws4fetch";

const require = createRequire(import.meta.url);
require("./load-project-env.mjs").applyLocalDatabaseEnvOverride();

const DEFAULT_PREFIXES = ["Products/", "products/"];

function parseArgs(argv) {
  let prefix = null;
  let dryRun = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--prefix" && argv[i + 1]) {
      prefix = argv[++i];
      if (!prefix.endsWith("/")) prefix += "/";
    }
  }
  return { prefix, dryRun };
}

function encodeR2Key(key) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function parseListObjectsXml(xml) {
  const keys = [];
  for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
    keys.push(match[1]);
  }
  const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
  const tokenMatch = xml.match(
    /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/,
  );
  return {
    keys,
    nextToken: truncated ? tokenMatch?.[1] : undefined,
  };
}

async function listKeys(client, baseUrl, bucket, prefix) {
  const keys = [];
  let token;
  do {
    const params = new URLSearchParams({ "list-type": "2", prefix });
    if (token) params.set("continuation-token", token);
    const res = await client.fetch(`${baseUrl}/${bucket}?${params}`);
    if (!res.ok) {
      throw new Error(`List failed (${res.status}) for prefix ${prefix}`);
    }
    const page = parseListObjectsXml(await res.text());
    for (const key of page.keys) {
      if (!key.endsWith("/")) keys.push(key);
    }
    token = page.nextToken;
  } while (token);
  return keys;
}

async function headContentType(client, baseUrl, bucket, key) {
  const res = await client.fetch(`${baseUrl}/${bucket}/${encodeR2Key(key)}`, {
    method: "HEAD",
  });
  if (!res.ok) return "application/octet-stream";
  return res.headers.get("content-type") || "application/octet-stream";
}

async function stripCacheControl(client, baseUrl, bucket, key) {
  const contentType = await headContentType(client, baseUrl, bucket, key);
  const copySource = `/${bucket}/${encodeR2Key(key)}`;
  const res = await client.fetch(`${baseUrl}/${bucket}/${encodeR2Key(key)}`, {
    method: "PUT",
    headers: {
      "x-amz-copy-source": copySource,
      "x-amz-metadata-directive": "REPLACE",
      "Content-Type": contentType,
      // Explicit short revalidate — do not use max-age=31536000 / immutable on product media.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Copy ${key} failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

async function main() {
  const { prefix, dryRun } = parseArgs(process.argv);
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim() || "humpbuck-site";
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY");
  }

  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const baseUrl = `https://${accountId}.r2.cloudflarestorage.com`;
  const prefixes = prefix ? [prefix] : DEFAULT_PREFIXES;

  const allKeys = [];
  for (const p of prefixes) {
    const keys = await listKeys(client, baseUrl, bucket, p);
    console.log(`[list] ${p} → ${keys.length} object(s)`);
    allKeys.push(...keys);
  }

  const unique = [...new Set(allKeys)];
  console.log(`[total] ${unique.length} object(s)${dryRun ? " (dry-run)" : ""}`);

  let ok = 0;
  let fail = 0;
  for (const key of unique) {
    if (dryRun) {
      console.log(`[dry-run] ${key}`);
      ok += 1;
      continue;
    }
    try {
      await stripCacheControl(client, baseUrl, bucket, key);
      ok += 1;
      if (ok % 25 === 0) console.log(`[ok] ${ok}/${unique.length}`);
    } catch (err) {
      fail += 1;
      console.error(`[fail] ${key}`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`[done] ok=${ok} fail=${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
