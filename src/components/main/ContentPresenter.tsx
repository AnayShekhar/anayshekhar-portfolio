"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { MenuSection } from "@/lib/content";
import { AboutSection } from "@/components/menu/sections/AboutSection";
import { ContactSection } from "@/components/menu/sections/ContactSection";
import { FutureSection } from "@/components/menu/sections/FutureSection";
import { ProjectsSection } from "@/components/menu/sections/ProjectsSection";

type ContentPresenterProps = {
  activeSection: MenuSection | null;
  visible: boolean;
};

function SectionContent({ section }: { section: MenuSection }) {
  switch (section) {
    case "about":
      return <AboutSection />;
    case "projects":
      return <ProjectsSection />;
    case "future":
      return <FutureSection />;
    case "contact":
      return <ContactSection />;
  }
}

export function ContentPresenter({
  activeSection,
  visible,
}: ContentPresenterProps) {
  return (
    <AnimatePresence mode="wait">
      {visible && activeSection && (
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-left"
        >
          <SectionContent section={activeSection} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
