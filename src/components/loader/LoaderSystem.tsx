"use client";

import { useEffect, useRef, useState } from "react";
import { useLoaderTimeline } from "@/hooks/useLoaderTimeline";
import { useTypewriter } from "@/hooks/useTypewriter";
import { LoaderStageShell } from "@/components/main/MainStage";
import { SystemStatus } from "./SystemStatus";
import { TypewriterText } from "./TypewriterText";

type LoaderSystemProps = {
  reducedMotion: boolean;
  onComplete: () => void;
  onStabilized?: () => void;
};

export function LoaderSystem({
  reducedMotion,
  onComplete,
  onStabilized,
}: LoaderSystemProps) {
  const { phase, elapsed, systemMessage, showGrid, overlayOpacity, isComplete } =
    useLoaderTimeline(reducedMotion);
  const { visibleText } = useTypewriter(true);
  const [dismissed, setDismissed] = useState(false);
  const stabilizedRef = useRef(false);

  useEffect(() => {
    if (systemMessage !== "stabilized" || stabilizedRef.current) return;
    stabilizedRef.current = true;
    onStabilized?.();
  }, [systemMessage, onStabilized]);

  useEffect(() => {
    if (!isComplete || overlayOpacity > 0.05) return;

    const timeout = setTimeout(() => {
      setDismissed(true);
      onComplete();
    }, 50);

    return () => clearTimeout(timeout);
  }, [isComplete, overlayOpacity, onComplete]);

  if (reducedMotion || dismissed) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 bg-bg"
      style={{ opacity: overlayOpacity }}
    >
      {showGrid && (
        <div
          className="faint-grid pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{ opacity: Math.min(1, (elapsed - 4200) / 800) }}
        />
      )}

      <LoaderStageShell>
        <TypewriterText
          phase={phase}
          visibleText={visibleText}
          systemMessage={systemMessage}
          elapsed={elapsed}
        />
        <SystemStatus message={systemMessage} />
      </LoaderStageShell>
    </div>
  );
}
