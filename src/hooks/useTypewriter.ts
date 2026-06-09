"use client";

import { useEffect, useState } from "react";
import { LOADER_TEXT } from "@/lib/content";
import { TYPEWRITER_DELAYS } from "@/lib/loaderPhases";

function getDelayForChar(char: string, index: number): number {
  if (char === ",") return TYPEWRITER_DELAYS.pauseAfterComma;
  if (index < 3) return TYPEWRITER_DELAYS.fast;
  return TYPEWRITER_DELAYS.slow;
}

export function useTypewriter(active: boolean) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;

    let index = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      if (index >= LOADER_TEXT.length) {
        setDone(true);
        return;
      }

      index += 1;
      setVisibleCount(index);

      const char = LOADER_TEXT[index - 1];
      const delay = getDelayForChar(char, index - 1);
      timeout = setTimeout(typeNext, delay);
    };

    timeout = setTimeout(typeNext, TYPEWRITER_DELAYS.fast);
    return () => clearTimeout(timeout);
  }, [active]);

  return {
    visibleText: LOADER_TEXT.slice(0, visibleCount),
    done,
  };
}
