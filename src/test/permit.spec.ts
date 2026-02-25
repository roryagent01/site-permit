import { describe, expect, it } from 'vitest';
import { canTransitionPermit } from '@/lib/domain/permit';

describe('permit lifecycle transitions', () => {
  it('allows draft -> submitted', () => {
    expect(canTransitionPermit('draft', 'submitted')).toBe(true);
  });

  it('blocks draft -> approved', () => {
    expect(canTransitionPermit('draft', 'approved')).toBe(false);
  });

  it('allows approved -> active', () => {
    expect(canTransitionPermit('approved', 'active')).toBe(true);
  });

  it('blocks closed -> active', () => {
    expect(canTransitionPermit('closed', 'active')).toBe(false);
  });
});
