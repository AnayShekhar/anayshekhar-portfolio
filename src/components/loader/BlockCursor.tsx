"use client";

import { useEffect, useState } from "react";
import { CURSOR_BLINK_MS } from "@/lib/loaderPhases";

type BlockCursorProps = {
  visible: boolean;
  blinking: boolean;
};

export function BlockCursor({ visible, blinking }: BlockCursorProps) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!blinking) return;

    const interval = setInterval(() => {
      setOn((prev) => !prev);
    }, CURSOR_BLINK_MS);

    return () => clearInterval(interval);
  }, [blinking]);

  if (!visible) return null;

  return (
    <span
      aria-hidden
      className="inline-block h-[1.05em] w-[0.55em] translate-y-[0.08em] bg-highlight transition-opacity duration-100"
      style={{ opacity: blinking && !on ? 0 : 1 }}
    />
  );
}
