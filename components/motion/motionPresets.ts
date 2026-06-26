export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const softScale = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: { opacity: 1, scale: 1 },
};

export const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.055,
    },
  },
};

export const panelTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
} as const;

export const routeTransition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
} as const;
