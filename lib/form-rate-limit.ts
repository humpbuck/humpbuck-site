type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkFormRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
):
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; remaining: 0; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: maxRequests - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function formRateLimitKey(ip: string | null, email: string) {
  return `${ip || "unknown"}:${email || "unknown"}`;
}
