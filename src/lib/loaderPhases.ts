// Shared motion curves. The cinematic loader was removed (CLAUDE.md §"remove
// the loader" — max 800ms introduction); only these restrained curves remain,
// used by the menu and the first-paint reveal.

export const uiRevealTransition = {
  duration: 0.7,
  ease: [0.16, 1, 0.3, 1] as const,
} as const;

// gentle, no overshoot — interactions should feel precise, not bouncy
export const panelSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.8,
} as const;
