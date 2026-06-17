export const ease = {
  smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
  snappy: [0.4, 0, 0.2, 1] as [number, number, number, number],
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: ease.smooth } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: ease.smooth } },
};

export const slideRight = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: ease.smooth } },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
