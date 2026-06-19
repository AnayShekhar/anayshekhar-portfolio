"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { MenuSection } from "@/lib/content";
import { CONTACT_CONTENT, MENU_SECTIONS } from "@/lib/content";
import { panelSpring, uiRevealTransition } from "@/lib/loaderPhases";

const DRAWER_OPEN_W = 288;
const DRAWER_OPEN_H = 332;
const DRAWER_CLOSE_W = 100;
const DRAWER_CLOSE_H = 46;

// subtle expand — no overshoot, like opening a precise instrument
const morphTransition = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1] as const,
};

interface MorphingMenuProps {
  activeSection: MenuSection | null;
  onSectionSelect: (section: MenuSection) => void;
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MorphingMenu({ activeSection, onSectionSelect }: MorphingMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // navigation is immediate — no warp, no transition takeover
  const handleSelect = (section: MenuSection) => {
    onSectionSelect(section);
    setOpen(false);
  };

  return (
    <motion.div
      className="fixed right-6 top-6 z-40 sm:right-10 sm:top-10"
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        width: open ? DRAWER_OPEN_W : DRAWER_CLOSE_W,
        height: open ? DRAWER_OPEN_H : DRAWER_CLOSE_H,
      }}
      transition={{
        opacity: uiRevealTransition,
        y: uiRevealTransition,
        width: morphTransition,
        height: morphTransition,
      }}
    >
      {/* panel */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={false}
        animate={{ borderRadius: open ? 14 : 23, backgroundColor: "#001219" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* hairline burnt-orange marker on the closed pill */}
      <motion.div
        className="absolute bottom-0 left-4 right-4 h-px"
        style={{ backgroundColor: "var(--color-burnt)" }}
        animate={{ opacity: open ? 0 : 0.55 }}
        transition={{ duration: 0.3 }}
      />

      {/* closed trigger */}
      <button
        type="button"
        className="absolute inset-0 z-10 flex items-center justify-center"
        onClick={() => setOpen(true)}
        aria-label="open menu"
        aria-expanded={open}
        style={{ pointerEvents: open ? "none" : "auto" }}
      >
        <motion.span
          className="menu-pill"
          style={{ color: "#F5F4F0" }}
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          menu
        </motion.span>
      </button>

      {/* close button */}
      <motion.button
        type="button"
        className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(245,244,240,0.08)", color: "#F5F4F0", pointerEvents: open ? "auto" : "none" }}
        onClick={() => setOpen(false)}
        aria-label="close menu"
        animate={{ opacity: open ? 1 : 0, rotate: open ? 0 : -90, scale: open ? 1 : 0.6 }}
        transition={panelSpring}
      >
        <CloseIcon />
      </motion.button>

      {/* nav content */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col justify-between overflow-hidden px-6 pb-6 pt-14"
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ pointerEvents: open ? "auto" : "none", color: "#F5F4F0" }}
        aria-hidden={!open}
      >
        <nav className="flex flex-col gap-1">
          {MENU_SECTIONS.map((section, i) => {
            const isActive = activeSection === section.id;
            return (
              <motion.button
                key={section.id}
                type="button"
                className="group flex items-center gap-3 py-1.5 text-left"
                onClick={() => handleSelect(section.id)}
                initial={false}
                animate={{ opacity: open ? 1 : 0, x: open ? 0 : -10 }}
                transition={{
                  delay: open ? 0.08 + i * 0.06 : 0,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ x: 5 }}
              >
                <motion.span
                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--color-burnt)" }}
                  animate={{ opacity: isActive ? 1 : 0.28, scale: isActive ? 1.35 : 1 }}
                  transition={panelSpring}
                />
                <motion.span
                  className="font-mono text-sm tracking-wide"
                  animate={{ opacity: isActive ? 1 : 0.62 }}
                  transition={{ duration: 0.2 }}
                >
                  {section.label}
                </motion.span>
              </motion.button>
            );
          })}
        </nav>

        {/* footer links — text only, no icons */}
        <div className="border-t pt-4" style={{ borderColor: "rgba(245,244,240,0.12)" }}>
          <div className="flex gap-4 font-mono text-xs" style={{ color: "rgba(245,244,240,0.5)" }}>
            {CONTACT_CONTENT.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className="transition-opacity hover:opacity-80"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
