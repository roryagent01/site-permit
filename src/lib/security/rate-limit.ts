const buckets = new Map<string, { count: number; resetAt: number }>();

export function enforceRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (b.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { allowed: true, remaining: max - b.count };
}

export function requestIp(headers: Headers) {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
