"use client";

import { motion } from "framer-motion";
import { HERO } from "@/lib/content";
import { ContentPresenter } from "@/components/main/ContentPresenter";
import type { MenuSection } from "@/lib/content";
import {
  cinematicSettlementCurve,
  uiRevealTransition,
} from "@/lib/loaderPhases";

type MainStageProps = {
  uiRevealed: boolean;
  loaderComplete: boolean;
  activeSection: MenuSection | null;
  contentVisible: boolean;
};

export function MainStage({
  uiRevealed,
  loaderComplete,
  activeSection,
  contentVisible,
}: MainStageProps) {
  return (
    <div className="faint-grid portfolio-layout-track px-6 pt-32">
      <div className="hero-header-zone intro-title-container transition-transform duration-500 ease-out">
        <motion.h1
          className="text-3xl font-medium tracking-tight text-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: loaderComplete ? 1 : 0 }}
          transition={cinematicSettlementCurve}
        >
          {HERO.title}
        </motion.h1>

        <motion.p
          className="subtext-array mt-2 font-mono text-sm tracking-widest text-mono-tag"
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: uiRevealed ? 1 : 0,
            y: uiRevealed ? 0 : 8,
          }}
          transition={uiRevealTransition}
        >
          {HERO.subtitle}
        </motion.p>
      </div>

      <div className="mt-16 w-full max-w-xl pb-24">
        <ContentPresenter
          activeSection={activeSection}
          visible={contentVisible}
        />
      </div>
    </div>
  );
}

export function LoaderStageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="portfolio-layout-track px-6 pt-32">
      <div className="hero-header-zone intro-title-container w-full max-w-xl text-center">
        {children}
      </div>
    </div>
  );
}
