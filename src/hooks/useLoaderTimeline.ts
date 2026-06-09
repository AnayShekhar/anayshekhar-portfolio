"use client";

import { useEffect, useState } from "react";
import {
  LOADER_TIMING,
  type LoaderPhase,
} from "@/lib/loaderPhases";

function getPhase(elapsed: number): LoaderPhase {
  if (elapsed >= LOADER_TIMING.complete) return "complete";
  if (elapsed >= LOADER_TIMING.latentStart) return "latent";
  if (elapsed >= LOADER_TIMING.decomposeStart) return "decompose";
  if (elapsed >= LOADER_TIMING.awarenessStart) return "awareness";
  return "identity";
}

function getSystemMessage(elapsed: number): "stabilized" | "awaiting" | null {
  if (elapsed < LOADER_TIMING.systemMessageStart) return null;
  if (elapsed < LOADER_TIMING.awaitingMessageStart) return "stabilized";
  if (elapsed < LOADER_TIMING.complete) return "awaiting";
  return null;
}

export function useLoaderTimeline(reducedMotion: boolean) {
  const [elapsed, setElapsed] = useState(
    reducedMotion ? LOADER_TIMING.complete : 0,
  );

  useEffect(() => {
    if (reducedMotion) return;

    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const ms = now - start;
      setElapsed(ms);
      if (ms < LOADER_TIMING.complete + 400) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const phase = getPhase(elapsed);
  const systemMessage = getSystemMessage(elapsed);
  const showGrid =
    elapsed >= LOADER_TIMING.latentStart && elapsed < LOADER_TIMING.complete + 400;
  const overlayOpacity =
    elapsed >= LOADER_TIMING.fadeOutStart
      ? Math.max(0, 1 - (elapsed - LOADER_TIMING.fadeOutStart) / 300)
      : 1;
  const isComplete = elapsed >= LOADER_TIMING.complete;

  return {
    elapsed,
    phase,
    systemMessage,
    showGrid,
    overlayOpacity,
    isComplete,
  };
}
