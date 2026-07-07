import { LRUCache } from 'lru-cache';

/**
 * Simple in-memory rate limiter using LRU cache.
 *
 * Each unique key (typically client IP) gets a counter that increments
 * on each request. When the counter exceeds the limit within the TTL
 * window, further requests are blocked.
 *
 * NOTE: This is an in-memory implementation suitable for single-instance
 * deployments and development. In serverless environments (Vercel),
 * each cold start gets a fresh cache. For production-grade limiting,
 * use a Redis-backed solution (e.g., Upstash).
 */

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of requests made in the current window */
  current: number;
  /** Maximum requests allowed in the window */
  limit: number;
}

// Module-level cache so it persists across requests within the same instance
const cache = new LRUCache<string, number>({
  max: 500, // Track up to 500 unique keys
  ttl: 60_000, // Default 60-second window
});

/**
 * Check and increment rate limit for a given key.
 *
 * @param key - Unique identifier (e.g., client IP address)
 * @param limit - Maximum number of requests allowed per window
 * @param windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
 * @returns RateLimitResult indicating whether the request is allowed
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): RateLimitResult {
  // Use a composite cache key that includes the window size
  // so different endpoints can have different limits
  const cacheKey = `${key}:${windowMs}`;

  const current = cache.get(cacheKey) ?? 0;

  if (current >= limit) {
    return { success: false, current, limit };
  }

  // Set with explicit TTL so different windows work correctly
  cache.set(cacheKey, current + 1, { ttl: windowMs });

  return { success: true, current: current + 1, limit };
}

/**
 * Extract client IP from request headers.
 * Handles x-forwarded-for (common behind proxies/Vercel) and
 * falls back to 'anonymous'.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (client) IP
    return forwarded.split(',')[0].trim();
  }
  return 'anonymous';
}
