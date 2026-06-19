"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { HERO, MENU_SECTIONS, SECTION_TITLES } from "@/lib/content";
import type { MenuSection } from "@/lib/content";
import InkField from "@/components/blob/InkField";
import { HeroHeadline } from "@/components/main/HeroHeadline";
import { MorphingMenu } from "@/components/menu/MorphingMenu";
import { AboutSection } from "@/components/menu/sections/AboutSection";
import { ProjectsSection } from "@/components/menu/sections/ProjectsSection";
import { FutureSection } from "@/components/menu/sections/FutureSection";
import { ContactSection } from "@/components/menu/sections/ContactSection";

export type StageView = "hero" | MenuSection;

interface MainStageProps {
  onSectionSelect: (section: MenuSection) => void;
}

const revealEase = [0.16, 1, 0.3, 1] as const;

function ChapterContent({ section }: { section: MenuSection }) {
  switch (section) {
    case "about":    return <AboutSection />;
    case "projects": return <ProjectsSection />;
    case "future":   return <FutureSection />;
    case "contact":  return <ContactSection />;
  }
}

function Chapter({ section, reduced }: { section: MenuSection; reduced: boolean }) {
  return (
    <section
      id={section}
      data-chapter={section}
      className="relative z-10 w-full px-6 py-28 sm:px-12 sm:py-36 lg:px-24"
      aria-label={SECTION_TITLES[section]}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.7, ease: revealEase }}
      >
        <header className="mb-10 border-b border-border pb-5">
          <h2
            className="font-sans text-4xl font-medium sm:text-5xl"
            style={{ color: "var(--color-header)", letterSpacing: "-0.02em" }}
          >
            {SECTION_TITLES[section]}
          </h2>
        </header>

        <div className="measure">
          <ChapterContent section={section} />
        </div>
      </motion.div>
    </section>
  );
}

const STAGE_IDS: StageView[] = ["hero", ...MENU_SECTIONS.map((s) => s.id)];

export function MainStage({ onSectionSelect }: MainStageProps) {
  const reduced = !!useReducedMotion();
  const [view, setView] = useState<StageView>("hero");
  const [introDone, setIntroDone] = useState(false);
  const viewRef = useRef<StageView>("hero");

  const handleIntroDone = useCallback(() => setIntroDone(true), []);

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

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  const activeSection: MenuSection | null = view === "hero" ? null : view;

  return (
    <div className={`relative w-full${introDone ? "" : " h-screen overflow-hidden"}`}>
      {/* Everything but the headline + caret stays hidden until the intro
          has finished typing — a completely blank canvas while it types. */}

      {/* ── Fixed background: faint notebook grid ── */}
      <motion.div
        className="notebook-grid pointer-events-none fixed inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.9, ease: revealEase }}
      />

      {/* ── The computational material — fixed, asymmetric, settling.
            Composed beside the title; never resized or moved by scroll. ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-[58%] -translate-y-1/2 sm:left-[60%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: introDone ? 0.62 : 0 }}
          transition={{ duration: 0.9, ease: revealEase }}
        >
          <InkField size={560} />
        </motion.div>
      </div>

      {/* ── Scroll progress rail (desktop) — quiet technical instrument ── */}
      <motion.div
        className="pointer-events-none fixed left-6 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ duration: 0.8, ease: revealEase }}
      >
        <div className="relative h-40 w-px" style={{ background: "var(--color-border)" }}>
          <motion.div
            className="absolute left-0 top-0 w-full"
            style={{
              height: "100%",
              originY: 0,
              scaleY: progress,
              background: "var(--color-teal-dark)",
            }}
          />
        </div>
      </motion.div>

      {introDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: revealEase }}
        >
          <MorphingMenu activeSection={activeSection} onSectionSelect={onSectionSelect} />
        </motion.div>
      )}

      {/* ── Narrative content ── */}
      <div>
        {/* HERO */}
        <section
          id="hero"
          data-chapter="hero"
          className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 text-center"
          aria-label="intro"
        >
          <HeroHeadline title={HERO.title} reduced={reduced} onDone={handleIntroDone} />

          {/* quiet scroll label — revealed cleanly once the intro resolves */}
          <motion.span
            className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 font-mono text-[0.625rem] uppercase tracking-[0.34em] text-mono-tag"
            initial={{ opacity: 0 }}
            animate={{ opacity: introDone && view === "hero" ? 0.7 : 0 }}
            transition={{ duration: 0.6, ease: revealEase }}
          >
            scroll
          </motion.span>
        </section>

        {introDone && (
          <>
            {/* CHAPTERS */}
            {MENU_SECTIONS.map((s) => (
              <Chapter key={s.id} section={s.id} reduced={reduced} />
            ))}

            {/* FOOTER */}
            <footer className="relative z-10 border-t border-border px-6 py-10 sm:px-12 lg:px-24">
              <div className="font-mono text-[0.6875rem] tracking-wide text-mono-tag">
                anay shekhar
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
