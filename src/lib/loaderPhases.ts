export type LoaderPhase =
  | "identity"
  | "awareness"
  | "decompose"
  | "latent"
  | "complete";

export const LOADER_TIMING = {
  identityStart: 0,
  awarenessStart: 1800,
  decomposeStart: 2800,
  latentStart: 4200,
  systemMessageStart: 6000,
  awaitingMessageStart: 6800,
  fadeOutStart: 7200,
  complete: 7500,
  settlementDelay: 6500,
} as const;

export const TYPEWRITER_DELAYS = {
  fast: 45,
  pauseAfterComma: 220,
  slow: 95,
} as const;

export const CURSOR_BLINK_MS = 530;

export const cinematicSettlementCurve = {
  type: "spring" as const,
  stiffness: 75,
  damping: 24,
  mass: 1.6,
};

export const cinematicSettlementPhysics = cinematicSettlementCurve;

export const textStabilizeSpring = cinematicSettlementCurve;

export const loaderStabilizeSpring = cinematicSettlementCurve;

export const uiRevealTransition = {
  duration: 0.4,
  ease: [0, 0, 0.2, 1] as const,
};

export const stagePanelTransition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const floatTransition = {
  duration: 1.35,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const latentTransition = {
  duration: 2.8,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const panelSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 32,
  mass: 0.8,
};
