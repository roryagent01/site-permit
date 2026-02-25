export type PermitStatus =
  | 'draft'
  | 'submitted'
  | 'needs_changes'
  | 'approved'
  | 'active'
  | 'closed'
  | 'cancelled'
  | 'expired';

const transitions: Record<PermitStatus, PermitStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['needs_changes', 'approved', 'cancelled'],
  needs_changes: ['submitted', 'cancelled'],
  approved: ['active', 'cancelled', 'expired'],
  active: ['closed', 'cancelled', 'expired'],
  closed: [],
  cancelled: [],
  expired: []
};

export function canTransitionPermit(from: PermitStatus, to: PermitStatus) {
  return transitions[from].includes(to);
}
