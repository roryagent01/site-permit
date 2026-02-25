import { describe, expect, it } from 'vitest';
import { getPlanLimitSnapshot } from '@/lib/limits';

describe('plan limits', () => {
  it('returns starter defaults', () => {
    const plan = getPlanLimitSnapshot('starter');
    expect(plan.users).toBeGreaterThan(0);
  });

  it('falls back to starter on unknown plan', () => {
    const plan = getPlanLimitSnapshot('unknown');
    expect(plan.permitsPerMonth).toBe(getPlanLimitSnapshot('starter').permitsPerMonth);
  });
});
