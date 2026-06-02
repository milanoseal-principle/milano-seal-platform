export const pageEntry = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

export const cardHover = {
  whileHover: { y: -2 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

export const goldPulse = "animate-pulse"; // Tailwind, for active pipeline stages

export const EASE = [0.22, 1, 0.36, 1] as const;
