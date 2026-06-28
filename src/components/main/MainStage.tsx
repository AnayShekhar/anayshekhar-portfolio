"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { HERO, MENU_SECTIONS, SECTION_TITLES } from "@/lib/content";
import type { MenuSection } from "@/lib/content";
import InkField from "@/components/blob/InkField";
import { GridDistortion, type BlobAnchor } from "@/components/blob/GridDistortion";
import { HeroHeadline } from "@/components/main/HeroHeadline";
import { MorphingMenu } from "@/components/menu/MorphingMenu";
import { AboutSection } from "@/components/menu/sections/AboutSection";
import { ProjectsSection } from "@/components/menu/sections/ProjectsSection";
import { FutureSection } from "@/components/menu/sections/FutureSection";
import { ContactSection } from "@/components/menu/sections/ContactSection";
import { PixelDivider } from "@/components/menu/sections/retro";
import { revealContainer } from "@/components/menu/sections/reveal";

export type StageView = "hero" | MenuSection;

interface MainStageProps {
  onSectionSelect: (section: MenuSection) => void;
}

const revealEase = [0.16, 1, 0.3, 1] as const;

// Faint phosphor/paper grain for the cream background (SVG turbulence, ~3%).
const SCREEN_NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Per-section canvas: each chapter introduces colour intentionally. Projects
// goes dark; connection sits on warm cream.
const SECTION_SURFACE: Record<MenuSection, { bg: string }> = {
  about: { bg: "#F5F4F0" },
  projects: { bg: "#001219" },
  future: { bg: "#F5F4F0" },
  contact: { bg: "#E9D8A6" },
};

function ChapterContent({ section }: { section: MenuSection }) {
  switch (section) {
    case "about":    return <AboutSection />;
    case "projects": return <ProjectsSection />;
    case "future":   return <FutureSection />;
    case "contact":  return <ContactSection />;
  }
}

function Chapter({ section, reduced }: { section: MenuSection; reduced: boolean }) {
  // The section is the in-view stagger container (IntersectionObserver via
  // framer-motion); each section component renders its own title + chrome.
  const surface = SECTION_SURFACE[section];
  return (
    <motion.section
      id={section}
      data-chapter={section}
      className="relative z-10 w-full overflow-hidden px-[7%] py-[10vh]"
      style={{ background: surface.bg }}
      aria-label={SECTION_TITLES[section]}
      variants={revealContainer}
      initial={reduced ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
    >
      <ChapterContent section={section} />
    </motion.section>
  );
}

const STAGE_IDS: StageView[] = ["hero", ...MENU_SECTIONS.map((s) => s.id)];

export function MainStage({ onSectionSelect }: MainStageProps) {
  const reduced = !!useReducedMotion();
  const [view, setView] = useState<StageView>("hero");
  const [introDone, setIntroDone] = useState(false);
  const viewRef = useRef<StageView>("hero");
  const anchorRef = useRef<BlobAnchor>({ x: 0, y: 0, radius: 160, strength: 0 });

  const handleIntroDone = useCallback(() => setIntroDone(true), []);
  const handleAnchorUpdate = useCallback((anchor: BlobAnchor) => {
    anchorRef.current = anchor;
  }, []);

  // active-chapter detection — section whose centre is closest to the viewport
  // centre. Re-runs once chapters mount after the intro finishes.
  useEffect(() => {
    if (!introDone) return;

    const els = STAGE_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const updateView = () => {
      const centerY = window.innerHeight / 2;
      let closest: { id: StageView; distance: number } | null = null;

      for (const el of els) {
        const rect = el.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - centerY);
        if (!closest || distance < closest.distance) {
          closest = { id: el.id as StageView, distance };
        }
      }

      if (closest && viewRef.current !== closest.id) {
        viewRef.current = closest.id;
        setView(closest.id);
      }
    };

    updateView();
    window.addEventListener("scroll", updateView, { passive: true });
    window.addEventListener("resize", updateView, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateView);
      window.removeEventListener("resize", updateView);
    };
  }, [introDone]);

  const activeSection: MenuSection | null = view === "hero" ? null : view;

  return (
    <div className={`relative h-full w-full${introDone ? "" : " overflow-hidden"}`}>
      {/* Everything but the headline + caret stays hidden until the intro
          has finished typing — a completely blank canvas while it types. */}

      {/* ── Fixed background: notebook grid with lens distortion beneath the blob ── */}
      <GridDistortion introDone={introDone} anchorRef={anchorRef} />

      {/* ── The computational material — a 2D metaball field, right-of-centre,
          present across all sections. It tracks the viewport centre with a lag;
          scroll energy distorts it internally; each section retunes its colour,
          complexity, and energy. ── */}
      <InkField introDone={introDone} onAnchorUpdate={handleAnchorUpdate} />

      {/* ── Physical screen depth (all pointer-events-none, above the content
          but below the menu button) ── */}

      {/* faint phosphor grain on the cream background (sits under the content) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          backgroundImage: SCREEN_NOISE,
          backgroundRepeat: "repeat",
          opacity: 0.03,
        }}
      />

      {/* elliptical CRT vignette — imperceptible: max 2% ink at the corners */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          background:
            "radial-gradient(ellipse farthest-corner at 50% 50%, rgba(0,18,25,0) 55%, rgba(0,18,25,0.02) 100%)",
        }}
      />

      {/* per-edge darkening — max 1.5% on every edge */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          backgroundImage: [
            "linear-gradient(to bottom, rgba(0,18,25,0.015), rgba(0,18,25,0) 60px)",
            "linear-gradient(to top, rgba(0,18,25,0.015), rgba(0,18,25,0) 60px)",
            "linear-gradient(to right, rgba(0,18,25,0.015), rgba(0,18,25,0) 40px)",
            "linear-gradient(to left, rgba(0,18,25,0.015), rgba(0,18,25,0) 40px)",
          ].join(", "),
        }}
      />

      {introDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: revealEase }}
        >
          <MorphingMenu activeSection={activeSection} onSectionSelect={onSectionSelect} />
        </motion.div>
      )}

      {/* ── Narrative content — sits on the LCD: a barely-perceptible contrast/
          brightness shift plus a 1.8° perspective tilt that follows the Mac
          screen geometry, so text reads as printed on glass, not a floating
          div. (No fixed descendants live in here, so nothing re-anchors.) ── */}
      <div style={{ perspective: "1200px", height: "100%" }}>
        <div
          style={{
            transform: "perspective(1200px) rotateX(1.8deg)",
            filter: "contrast(1.02) brightness(0.99)",
            height: "100%",
          }}
        >
        {/* HERO */}
        <section
          id="hero"
          data-chapter="hero"
          className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center"
          aria-label="intro"
        >
          <HeroHeadline title={HERO.title} reduced={reduced} onDone={handleIntroDone} />

          {/* quiet scroll indicator — a retro outline button, revealed cleanly */}
          <motion.span
            className="retro-btn t-mono absolute bottom-10 left-1/2 z-10 -translate-x-1/2 font-mono uppercase"
            style={{ letterSpacing: "0.28em", padding: "8px 16px", borderRadius: 2 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: introDone && view === "hero" ? 1 : 0 }}
            transition={{ duration: 0.6, ease: revealEase }}
          >
            scroll
          </motion.span>
        </section>

        {introDone && (
          <>
            {/* CHAPTERS — major sections separated by old-system pixel dividers */}
            {MENU_SECTIONS.map((s, i) => (
              <div key={s.id}>
                {i > 0 && <PixelDivider />}
                <Chapter section={s.id} reduced={reduced} />
              </div>
            ))}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
