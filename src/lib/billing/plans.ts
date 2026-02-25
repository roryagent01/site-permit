export const PLAN_FEATURES = {
  starter: {
    display: 'Starter',
    dedicatedHostingEligible: false
  },
  growth: {
    display: 'Growth',
    dedicatedHostingEligible: true
  },
  scale: {
    display: 'Scale',
    dedicatedHostingEligible: true
  }
} as const;
