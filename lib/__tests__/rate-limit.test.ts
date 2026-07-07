import { describe, it, expect } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('In-memory Rate Limiter', () => {
  it('should allow requests under the limit', () => {
    const key = 'test-ip-1';
    const limit = 3;

    // First request
    const res1 = rateLimit(key, limit);
    expect(res1.success).toBe(true);
    expect(res1.current).toBe(1);
    expect(res1.limit).toBe(limit);

    // Second request
    const res2 = rateLimit(key, limit);
    expect(res2.success).toBe(true);
    expect(res2.current).toBe(2);

    // Third request
    const res3 = rateLimit(key, limit);
    expect(res3.success).toBe(true);
    expect(res3.current).toBe(3);
  });

  it('should block requests exceeding the limit', () => {
    const key = 'test-ip-2';
    const limit = 2;

    rateLimit(key, limit); // 1
    rateLimit(key, limit); // 2
    
    // Third should fail
    const res3 = rateLimit(key, limit);
    expect(res3.success).toBe(false);
    expect(res3.current).toBe(2); // Counter should stay at limit
  });

  it('should separate limits by key', () => {
    const keyA = 'ip-a';
    const keyB = 'ip-b';
    const limit = 1;

    // Consume key A limit
    expect(rateLimit(keyA, limit).success).toBe(true);
    expect(rateLimit(keyA, limit).success).toBe(false);

    // Key B should still be allowed
    expect(rateLimit(keyB, limit).success).toBe(true);
  });

  it('should handle composite rate windows without collision', () => {
    const key = 'same-ip';
    
    // Window 1: 5 requests per 10s
    const res1 = rateLimit(key, 5, 10000);
    expect(res1.success).toBe(true);

    // Window 2: 1 request per 60s
    const res2 = rateLimit(key, 1, 60000);
    expect(res2.success).toBe(true);
    
    // Window 2 second request should be blocked
    const res3 = rateLimit(key, 1, 60000);
    expect(res3.success).toBe(false);
  });
});
