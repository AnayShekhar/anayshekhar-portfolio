"use client";

import { useEffect, useState } from "react";
import { LoaderSystem } from "@/components/loader/LoaderSystem";
import { MainStage } from "@/components/main/MainStage";
import { MorphingMenu } from "@/components/menu/MorphingMenu";
import type { MenuSection } from "@/lib/content";

function getReducedMotionPreference() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Home() {
  const [loaderComplete, setLoaderComplete] = useState(() =>
    getReducedMotionPreference(),
  );
  const [uiRevealed, setUiRevealed] = useState(() =>
    getReducedMotionPreference(),
  );
  const [activeSection, setActiveSection] = useState<MenuSection>("about");
  const [viewportSection, setViewportSection] = useState<MenuSection | null>(
    null,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    getReducedMotionPreference(),
  );

  const contentVisible =
    loaderComplete && viewportSection !== null && !menuOpen;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const prefersReduced = media.matches;
      setReducedMotion(prefersReduced);
      if (prefersReduced) {
        setLoaderComplete(true);
        setUiRevealed(true);
      }
    };

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const handleSectionSelect = (section: MenuSection) => {
    setActiveSection(section);
    setViewportSection(section);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg">
      <MainStage
        uiRevealed={uiRevealed}
        loaderComplete={loaderComplete}
        activeSection={viewportSection}
        contentVisible={contentVisible}
      />

      {!loaderComplete && (
        <LoaderSystem
          reducedMotion={reducedMotion}
          onStabilized={() => setUiRevealed(true)}
          onComplete={() => setLoaderComplete(true)}
        />
      )}

      <MorphingMenu
        revealed={uiRevealed}
        interactive={loaderComplete}
        activeSection={activeSection}
        onSectionSelect={handleSectionSelect}
        onOpenChange={setMenuOpen}
      />
    </main>
  );
}
