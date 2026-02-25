import { describe, expect, it } from 'vitest';
import { evaluateQualificationGate } from '@/lib/domain/qualification-gate';

describe('qualification gate', () => {
  it('blocks when required qualification is missing and mode=block', () => {
    const result = evaluateQualificationGate(
      { mode: 'block', requiredQualificationTypeIds: ['q1'] },
      [],
      '2026-02-25'
    );
    expect(result.blocked).toBe(true);
    expect(result.missingQualificationTypeIds).toEqual(['q1']);
  });

  it('warns (not blocked) when mode=warn', () => {
    const result = evaluateQualificationGate(
      { mode: 'warn', requiredQualificationTypeIds: ['q1'] },
      [],
      '2026-02-25'
    );
    expect(result.blocked).toBe(false);
    expect(result.reason).toContain('warning');
  });

  it('passes when required qualification is present and valid', () => {
    const result = evaluateQualificationGate(
      { mode: 'block', requiredQualificationTypeIds: ['q1'] },
      [{ qualification_type_id: 'q1', expiry_date: '2026-12-31' }],
      '2026-02-25'
    );
    expect(result.blocked).toBe(false);
  });
});
