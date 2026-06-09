"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { MenuSection } from "@/lib/content";
import { MENU_SECTIONS } from "@/lib/content";
import { panelSpring } from "@/lib/loaderPhases";

const NAV_ITEM_HEIGHT = 36;
const NAV_GAP = 12;

type DrawerNavProps = {
  active: MenuSection;
  onSelect: (section: MenuSection) => void;
};

export function DrawerNav({ active, onSelect }: DrawerNavProps) {
  const [hoveredId, setHoveredId] = useState<MenuSection | null>(null);
  const activeIndex = MENU_SECTIONS.findIndex((s) => s.id === active);

  return (
    <nav
      className="navigation-link-list relative flex flex-col"
      style={{ gap: NAV_GAP }}
      onMouseLeave={() => setHoveredId(null)}
    >
      <motion.span
        aria-hidden
        className="absolute h-1.5 w-1.5 rounded-full bg-header"
        initial={false}
        animate={{
          y: activeIndex * (NAV_ITEM_HEIGHT + NAV_GAP) + (NAV_ITEM_HEIGHT - 6) / 2,
        }}
        transition={panelSpring}
      />

      {MENU_SECTIONS.map((section) => {
        const isActive = active === section.id;
        const isDimmed = hoveredId !== null && hoveredId !== section.id;

        return (
          <button
            key={section.id}
            type="button"
            data-target={section.id}
            onClick={() => onSelect(section.id)}
            onMouseEnter={() => setHoveredId(section.id)}
            className="relative flex items-center pl-5 text-left text-sm sm:text-base"
            style={{ height: NAV_ITEM_HEIGHT }}
          >
            <motion.span
              className="text-drawer-text"
              initial={false}
              animate={{
                opacity: isDimmed ? 0.4 : isActive ? 1 : 0.65,
                x: hoveredId === section.id ? 8 : 0,
              }}
              transition={panelSpring}
            >
              {section.label}
            </motion.span>
          </button>
        );
      })}
    </nav>
  );
}

export const elasticEase = [0.68, -0.6, 0.32, 1.6] as const;
