import { AwsClient } from "aws4fetch";
import { R2_BUCKET_NAME_DEFAULT } from "@/lib/r2";

function r2Credentials() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim() || R2_BUCKET_NAME_DEFAULT;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("R2 credentials are not configured");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function r2AwsClient(): AwsClient {
  const { accessKeyId, secretAccessKey } = r2Credentials();
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

function r2BaseUrl(): string {
  const { accountId } = r2Credentials();
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export async function presignR2Put(
  key: string,
  contentType: string,
  expiresInSeconds: number,
): Promise<string> {
  const { bucket } = r2Credentials();
  const client = r2AwsClient();
  const objectUrl = `${r2BaseUrl()}/${bucket}/${encodeR2Key(key)}?X-Amz-Expires=${expiresInSeconds}`;
  const signed = await client.sign(
    new Request(objectUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
    }),
    { aws: { signQuery: true } },
  );
  return signed.url.toString();
}

function encodeR2Key(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

type ListPage = {
  keys: string[];
  nextToken?: string;
};

function parseListObjectsXml(xml: string): ListPage {
  const keys: string[] = [];
  for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
    keys.push(match[1]!);
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

export async function listR2ObjectKeys(prefix: string): Promise<string[]> {
  const { bucket } = r2Credentials();
  const client = r2AwsClient();
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const params = new URLSearchParams({
      "list-type": "2",
      prefix,
    });
    if (token) params.set("continuation-token", token);

    const res = await client.fetch(`${r2BaseUrl()}/${bucket}?${params}`);
    if (!res.ok) {
      throw new Error(`R2 list failed (${res.status})`);
    }
    const page = parseListObjectsXml(await res.text());
    for (const key of page.keys) {
      if (!key.endsWith("/")) keys.push(key);
    }
    token = page.nextToken;
  } while (token);

  return keys;
}
