/**
 * Minimal in-memory, per-key sliding-window rate limiter.
 *
 * Intended for throttling sensitive endpoints (login, register) to slow down
 * brute-force and enumeration attempts. This is process-local — good enough for
 * a single-instance deployment. A multi-instance deployment should back this
 * with a shared store (e.g. Redis) instead.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Occasionally evict stale buckets so the map can't grow without bound.
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    const fresh = bucket.timestamps.filter((t) => now - t < windowMs);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else {
      bucket.timestamps = fresh;
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Record an attempt for `key` and report whether it is within the limit.
 *
 * @param key      Identifier to throttle on (e.g. `login:<ip>`).
 * @param limit    Max attempts allowed within the window.
 * @param windowMs Sliding window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  // Drop timestamps outside the current window.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Best-effort client IP extraction from proxy headers, falling back to a
 * shared bucket when unavailable (still throttles, just less granular).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
