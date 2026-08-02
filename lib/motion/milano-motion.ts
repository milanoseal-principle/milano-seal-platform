export const motionTokens = {
  duration: {
    instant: 0.12,
    fast: 0.2,
    standard: 0.35,
    deliberate: 0.55,
    cinematic: 0.8,
  },
  easing: {
    standard: [0.22, 1, 0.36, 1],
    enter: [0.16, 1, 0.3, 1],
    exit: [0.4, 0, 1, 1],
    linear: [0, 0, 1, 1],
  },
  distance: {
    subtle: 8,
    standard: 16,
    large: 28,
  },
} as const;

export const milanoTransitions = {
  pageEnter: {
    duration: motionTokens.duration.standard,
    ease: motionTokens.easing.enter,
  },
  sectionEnter: {
    duration: motionTokens.duration.deliberate,
    ease: motionTokens.easing.enter,
  },
  interaction: {
    duration: motionTokens.duration.fast,
    ease: motionTokens.easing.standard,
  },
} as const;

