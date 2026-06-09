"use client";

import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { LOADER_TEXT } from "@/lib/content";
import type { LoaderPhase } from "@/lib/loaderPhases";
import {
  cinematicSettlementCurve,
  floatTransition,
  latentTransition,
  LOADER_TIMING,
} from "@/lib/loaderPhases";
import { BlockCursor } from "./BlockCursor";

type CharDrift = {
  decomposeX: number;
  decomposeY: number;
  latentX: number;
  latentY: number;
};

type CharPosition = {
  left: number;
  top: number;
};

function getCharDrift(index: number): CharDrift {
  const a = Math.sin((index + 1) * 127.1) * 43758.5453;
  const b = Math.sin((index + 1) * 269.5) * 43758.5453;
  const rx = a - Math.floor(a);
  const ry = b - Math.floor(b);

  return {
    decomposeX: (rx - 0.5) * 76,
    decomposeY: (ry - 0.5) * 52 - 14,
    latentX: (rx > 0.5 ? 1 : -1) * (36 + (index % 5) * 10),
    latentY: (ry > 0.5 ? 1 : -1) * (28 + (index % 4) * 8),
  };
}

type TypewriterTextProps = {
  phase: LoaderPhase;
  visibleText: string;
  systemMessage: "stabilized" | "awaiting" | null;
  elapsed: number;
};

export function TypewriterText({
  phase,
  visibleText,
  systemMessage,
  elapsed,
}: TypewriterTextProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [charPositions, setCharPositions] = useState<CharPosition[]>([]);
  const [gridReady, setGridReady] = useState(false);

  const characters = useMemo(
    () =>
      LOADER_TEXT.split("").map((char, index) => ({
        char,
        index,
        drift: getCharDrift(index),
      })),
    [],
  );

  const isFloating = phase === "decompose" || phase === "latent";
  const canSettle =
    elapsed >= LOADER_TIMING.settlementDelay &&
    (systemMessage === "stabilized" || systemMessage === "awaiting");
  const showInlineCursor =
    gridReady && !isFloating && !canSettle && (phase === "identity" || phase === "awareness");
  const showBaselineCursor = gridReady && canSettle;

  useLayoutEffect(() => {
    if (!measureRef.current || gridReady) return;

    const containerRect = measureRef.current.getBoundingClientRect();
    const spans = measureRef.current.querySelectorAll("[data-glyph]");
    const positions: CharPosition[] = [];

    spans.forEach((span) => {
      const rect = span.getBoundingClientRect();
      positions.push({
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
      });
    });

    setCharPositions(positions);
    setGridReady(true);
  }, [gridReady]);

  if (phase === "complete") return null;

  const getCharMotion = (index: number, drift: CharDrift) => {
    if (canSettle) {
      return { x: 0, y: 0, opacity: 1 };
    }

    if (isFloating && gridReady) {
      return {
        x:
          phase === "decompose"
            ? drift.decomposeX
            : drift.decomposeX + drift.latentX,
        y:
          phase === "decompose"
            ? drift.decomposeY
            : drift.decomposeY + drift.latentY,
        opacity: 0.4,
      };
    }

    const isVisible = index < visibleText.length;
    return { x: 0, y: 0, opacity: isVisible ? 1 : 0 };
  };

  const getTransition = () => {
    if (canSettle) return cinematicSettlementCurve;
    if (phase === "decompose") return floatTransition;
    if (phase === "latent") return latentTransition;
    return { duration: 0.15 };
  };

  return (
    <div className="loader-engine-canvas min-h-[120px] font-mono text-2xl font-medium tracking-tight text-header">
      <div
        ref={measureRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0"
        aria-hidden
      >
        <div className="whitespace-nowrap">
          {characters.map(({ char, index }) => (
            <span key={`measure-${index}`} data-glyph className="glitch-character-node">
              {char === " " ? "\u00a0" : char}
            </span>
          ))}
        </div>
      </div>

      {gridReady && charPositions.length > 0 && (
        <div className="absolute inset-0 overflow-visible">
          {characters.map(({ char, index, drift }) => {
            const pos = charPositions[index];
            if (!pos) return null;

            return (
              <motion.span
                key={`node-${index}`}
                className="glitch-character-node absolute whitespace-pre"
                style={{ left: pos.left, top: pos.top }}
                initial={false}
                animate={getCharMotion(index, drift)}
                transition={getTransition()}
              >
                {char === " " ? "\u00a0" : char}
              </motion.span>
            );
          })}

          {showInlineCursor && charPositions.length > 0 && (
            <span
              className="absolute inline-flex"
              style={{
                left:
                  (charPositions[Math.max(0, visibleText.length - 1)]?.left ?? 0) +
                  (visibleText.length > 0 ? 12 : 0),
                top: charPositions[0]?.top ?? 0,
              }}
            >
              <BlockCursor visible blinking={phase === "awareness"} />
            </span>
          )}

          {showBaselineCursor && (
            <motion.span
              className="absolute inline-flex"
              style={{
                left:
                  charPositions[charPositions.length - 1].left +
                  (characters[characters.length - 1].char === " " ? 8 : 12),
                top: charPositions[charPositions.length - 1].top,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={cinematicSettlementCurve}
            >
              <BlockCursor visible blinking />
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
}
