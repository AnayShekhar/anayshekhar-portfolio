"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface HeroHeadlineProps {
  title: string;
  reduced: boolean;
  /** fired once the line is fully typed and the caret has settled */
  onDone: () => void;
}

// ── Intro pacing ──
const START_DELAY = 280;   // let the hero fade settle before the first glyph
const HI_STEP = 95;        // "hi" — deliberate, unhurried
const PAUSE_AFTER_HI = 1000;
const REST_STEP = 78;      // "i'm anay" — a touch faster, human rhythm
const PUNCT_STEP = 50;     // comma / space land quickly
const END_HOLD = 600;      // caret blinks a beat, then resolves

export function HeroHeadline({ title, reduced, onDone }: HeroHeadlineProps) {
  const [count, setCount] = useState(reduced ? title.length : 0);
  const [blink, setBlink] = useState(false);
  const [fading, setFading] = useState(false);
  const [showCaret, setShowCaret] = useState(!reduced);

  useEffect(() => {
    if (reduced) {
      onDone();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, d: number) => timers.push(setTimeout(fn, d));

    let t = START_DELAY;

    // type "hi" (the pause lands after these two glyphs)
    at(() => setCount(1), t);
    t += HI_STEP;
    at(() => {
      setCount(2);
      setBlink(true); // caret idles/blinks through the pause
    }, t);
    t += PAUSE_AFTER_HI;

    // resume typing the remainder — solid caret while it moves
    at(() => setBlink(false), t);
    for (let i = 2; i < title.length; i++) {
      const ch = title[i];
      const step = ch === "," || ch === " " ? PUNCT_STEP : REST_STEP + (i % 2 ? 9 : -6);
      at(() => setCount(i + 1), t);
      t += step;
    }

    // settle: blink a beat, fade the caret out, then hand off cleanly
    at(() => setBlink(true), t);
    t += END_HOLD;
    at(() => {
      setBlink(false);
      setFading(true);
      onDone();
    }, t);
    at(() => setShowCaret(false), t + 360);

    return () => timers.forEach(clearTimeout);
  }, [reduced, title, onDone]);

  return (
    <h1
      className="relative z-10 font-sans font-medium"
      style={{
        color: "var(--color-header)",
        fontSize: "clamp(2.75rem, 9vw, 7rem)",
        letterSpacing: "-0.03em",
        lineHeight: 1.02,
      }}
      aria-label={title}
    >
      <span aria-hidden>{title.slice(0, count)}</span>
      {showCaret && (
        <motion.span
          aria-hidden
          style={{
            display: "inline-block",
            width: "0.055em",
            height: "0.74em",
            marginLeft: "0.06em",
            borderRadius: 1,
            transform: "translateY(0.02em)",
            background: "var(--color-amber)",
          }}
          animate={
            fading
              ? { opacity: 0 }
              : blink
                ? { opacity: [1, 1, 0, 0] }
                : { opacity: 1 }
          }
          transition={
            fading
              ? { duration: 0.34, ease: [0.16, 1, 0.3, 1] }
              : blink
                ? { duration: 1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" }
                : { duration: 0.12 }
          }
        />
      )}
    </h1>
  );
}
