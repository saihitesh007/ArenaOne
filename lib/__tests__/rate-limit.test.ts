import { describe, it, expect } from 'vitest';
import { rateLimit, getClientIp } from '../rate-limit';

describe('In-memory Rate Limiter', () => {
  it('should allow requests under the limit', () => {
    const key = 'test-ip-1';
    const limit = 3;

    const res1 = rateLimit(key, limit);
    expect(res1.success).toBe(true);
    expect(res1.current).toBe(1);
    expect(res1.limit).toBe(limit);

    const res2 = rateLimit(key, limit);
    expect(res2.success).toBe(true);
    expect(res2.current).toBe(2);

    const res3 = rateLimit(key, limit);
    expect(res3.success).toBe(true);
    expect(res3.current).toBe(3);
  });

  it('should block requests exceeding the limit', () => {
    const key = 'test-ip-2';
    const limit = 2;

    rateLimit(key, limit);
    rateLimit(key, limit);

    const res3 = rateLimit(key, limit);
    expect(res3.success).toBe(false);
    expect(res3.current).toBe(2);
  });

  it('should separate limits by key', () => {
    const keyA = 'ip-a';
    const keyB = 'ip-b';
    const limit = 1;

    expect(rateLimit(keyA, limit).success).toBe(true);
    expect(rateLimit(keyA, limit).success).toBe(false);
    expect(rateLimit(keyB, limit).success).toBe(true);
  });

  it('should handle composite rate windows without collision', () => {
    const key = 'same-ip';

    const res1 = rateLimit(key, 5, 10000);
    expect(res1.success).toBe(true);

    const res2 = rateLimit(key, 1, 60000);
    expect(res2.success).toBe(true);

    const res3 = rateLimit(key, 1, 60000);
    expect(res3.success).toBe(false);
  });
});

describe('getClientIp', () => {
  it('extracts the first IP from a comma-separated x-forwarded-for header', () => {
    const request = new Request('http://localhost/test', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1, 172.16.0.3' },
    });
    expect(getClientIp(request)).toBe('203.0.113.5');
  });

  it('returns the single IP when x-forwarded-for has one entry', () => {
    const request = new Request('http://localhost/test', {
      headers: { 'x-forwarded-for': '198.51.100.42' },
    });
    expect(getClientIp(request)).toBe('198.51.100.42');
  });

  it('returns "anonymous" when x-forwarded-for header is absent', () => {
    const request = new Request('http://localhost/test');
    expect(getClientIp(request)).toBe('anonymous');
  });
});
