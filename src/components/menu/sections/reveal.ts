import type { Variants } from "framer-motion";

// Entrance choreography. framer-motion's `whileInView` drives these via
// IntersectionObserver (threshold ~0.12) — no scroll listeners — and every
// variant animates transform + opacity only, so it holds 60fps.
//
// The signature easing is a slight-overshoot cubic-bezier giving each block a
// clean mechanical "snap" as it settles.
const SNAP = [0.34, 1.56, 0.64, 1] as const;

// Stagger orchestrator (no visuals of its own — sequences children 50ms apart)
export const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

// Default content block: rise + faint scale, snapping in over 360ms
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.99 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.36, ease: SNAP },
  },
};

// Section titles slide in from the left
export const revealTitle: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.36, ease: SNAP },
  },
};
