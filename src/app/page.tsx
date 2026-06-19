"use client";

import { useCallback } from "react";
import { MainStage } from "@/components/main/MainStage";
import type { MenuSection } from "@/lib/content";

function getReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Home() {
  // No loader: the first screen appears immediately (CLAUDE.md §"remove the
  // loader"). The menu highlight simply follows the chapter you scroll into.

  const scrollToSection = useCallback((section: MenuSection) => {
    const el = document.getElementById(section);
    if (!el) return;
    el.scrollIntoView({
      behavior: getReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  return (
    <main className="relative w-full">
      <MainStage onSectionSelect={scrollToSection} />
    </main>
  );
}
