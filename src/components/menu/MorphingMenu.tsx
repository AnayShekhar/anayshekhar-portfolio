"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { MenuSection } from "@/lib/content";
import { panelSpring, uiRevealTransition } from "@/lib/loaderPhases";
import { DrawerFooter } from "./DrawerFooter";
import { DrawerNav, elasticEase } from "./DrawerNav";

const DRAWER_OPEN_WIDTH = 280;
const DRAWER_OPEN_HEIGHT = 320;
const DRAWER_CLOSED_WIDTH = 90;
const DRAWER_CLOSED_HEIGHT = 48;

const widthTransition = {
  duration: 0.9,
  ease: elasticEase,
};

const heightTransition = {
  duration: 1.0,
  ease: elasticEase,
};

const contentFadeTransition = {
  duration: 0.4,
  ease: elasticEase,
};

type MorphingMenuProps = {
  revealed?: boolean;
  interactive?: boolean;
  activeSection: MenuSection;
  onSectionSelect: (section: MenuSection) => void;
  onOpenChange?: (open: boolean) => void;
};

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className="text-drawer-text"
    >
      <path
        d="M1 1L13 13M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MorphingMenu({
  revealed = false,
  interactive = false,
  activeSection,
  onSectionSelect,
  onOpenChange,
}: MorphingMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleOpen = () => {
    if (interactive) setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleNavSelect = (section: MenuSection) => {
    onSectionSelect(section);
    setOpen(false);
  };

  return (
    <motion.div
      className="elastic-drawer menu-component-wrapper fixed right-6 top-6 z-40 sm:right-10 sm:top-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: revealed ? 1 : 0,
        y: revealed ? 0 : 8,
        width: open ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH,
        height: open ? DRAWER_OPEN_HEIGHT : DRAWER_CLOSED_HEIGHT,
      }}
      transition={{
        opacity: uiRevealTransition,
        y: uiRevealTransition,
        width: widthTransition,
        height: heightTransition,
      }}
      style={{
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      <motion.div
        className="subwrapper-canvas absolute inset-0 border border-text/15"
        initial={false}
        animate={{
          borderRadius: open ? 16 : 24,
          backgroundColor: open ? "#0f1419" : "rgb(15 20 25 / 0.92)",
          borderColor: open ? "rgb(248 250 252 / 0.08)" : "rgb(148 163 184 / 0.15)",
        }}
        transition={{
          borderRadius: open ? widthTransition : panelSpring,
          backgroundColor: contentFadeTransition,
          borderColor: contentFadeTransition,
        }}
      />

      <button
        type="button"
        className="trigger-button absolute inset-0 z-10 flex items-center justify-center"
        onClick={handleOpen}
        aria-label="open menu"
        style={{ pointerEvents: open ? "none" : "auto" }}
      >
        <motion.span
          className="text text-sm text-body"
          initial={false}
          animate={{
            opacity: open ? 0 : 1,
            x: open ? 8 : 0,
          }}
          transition={contentFadeTransition}
        >
          menu
        </motion.span>
      </button>

      <motion.button
        type="button"
        className="close-trigger close-icon-container absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-drawer-text/5"
        onClick={handleClose}
        aria-label="close menu"
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          scale: open ? 1 : 0.125,
          rotate: open ? 0 : -45,
        }}
        transition={panelSpring}
        style={{ pointerEvents: open ? "auto" : "none" }}
      >
        <CloseIcon />
      </motion.button>

      <motion.div
        className="absolute inset-0 z-10 flex flex-col justify-between overflow-hidden px-6 pb-5 pt-14 text-drawer-text"
        aria-hidden={!open}
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          y: open ? 0 : 15,
        }}
        transition={contentFadeTransition}
        style={{ pointerEvents: open ? "auto" : "none" }}
      >
        <DrawerNav active={activeSection} onSelect={handleNavSelect} />
        <DrawerFooter />
      </motion.div>
    </motion.div>
  );
}
