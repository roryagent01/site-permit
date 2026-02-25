import { describe, expect, it } from 'vitest';
import { enforceRateLimit } from '@/lib/security/rate-limit';

describe('rate limiter', () => {
  it('blocks after threshold in window', () => {
    const key = `test-${Date.now()}`;
    expect(enforceRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(enforceRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(enforceRateLimit(key, 2, 60_000).allowed).toBe(false);
  });
});
