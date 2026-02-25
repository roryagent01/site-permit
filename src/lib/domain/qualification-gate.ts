export type QualificationGateMode = 'block' | 'warn';

export type QualificationGateDefinition = {
  mode?: QualificationGateMode;
  requiredQualificationTypeIds?: string[];
};

export type ContractorQualificationLite = {
  qualification_type_id: string;
  expiry_date: string | null;
};

export type QualificationGateEvaluation = {
  blocked: boolean;
  reason?: string;
  missingQualificationTypeIds: string[];
};

export function evaluateQualificationGate(
  gate: QualificationGateDefinition | null | undefined,
  qualifications: ContractorQualificationLite[],
  todayIsoDate: string
): QualificationGateEvaluation {
  const required = gate?.requiredQualificationTypeIds ?? [];
  if (!required.length) return { blocked: false, missingQualificationTypeIds: [] };

  const missing = required.filter((id) => {
    const found = qualifications.find((q) => q.qualification_type_id === id && (!q.expiry_date || q.expiry_date >= todayIsoDate));
    return !found;
  });

  if (!missing.length) return { blocked: false, missingQualificationTypeIds: [] };

  if (gate?.mode === 'block') {
    return {
      blocked: true,
      reason: `missing qualifications: ${missing.join(', ')}`,
      missingQualificationTypeIds: missing
    };
  }

  return {
    blocked: false,
    reason: `warning: missing qualifications ${missing.join(', ')}`,
    missingQualificationTypeIds: missing
  };
}
