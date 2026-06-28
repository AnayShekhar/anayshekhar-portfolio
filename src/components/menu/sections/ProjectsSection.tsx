import { motion } from "framer-motion";
import { PROJECTS, SECTION_TITLES } from "@/lib/content";
import { revealContainer, revealItem, revealTitle } from "./reveal";
import { PixelDivider } from "./retro";

// Category metadata label per project (mono, light teal on dark).
const CATEGORY: Record<string, string> = {
  "fern.ai": "medical ai",
  pokepy: "language model",
};

// Full dark (#001219) section — clean typographic hierarchy only. No cards, no
// boxes: amber names, light-teal category tags, cream descriptions, projects
// parted by a faint dashed deep-teal rule.
export function ProjectsSection() {
  return (
    <motion.div variants={revealContainer}>
      <motion.h2
        variants={revealTitle}
        className="t-title font-sans font-normal leading-[1.05]"
        style={{ color: "#F5F4F0", letterSpacing: "-0.02em" }}
      >
        {SECTION_TITLES.projects}
      </motion.h2>

      <div className="mt-12">
        {PROJECTS.map((project, i) => (
          <div key={project.name}>
            {i > 0 && (
              <PixelDivider dash="rgba(0,95,115,0.4)" className="my-10" />
            )}
            <motion.article variants={revealItem}>
              <h3
                className="t-name font-sans leading-tight"
                style={{ color: "#EE9B00", fontWeight: 600, letterSpacing: "-0.02em" }}
              >
                {project.name}
              </h3>
              <p
                className="t-mono mt-2 font-mono uppercase"
                style={{ color: "#94D2BD", letterSpacing: "0.18em" }}
              >
                {CATEGORY[project.name]}
              </p>
              <p
                className="t-body mt-5 font-sans leading-[1.85]"
                style={{ color: "#E9D8A6", fontWeight: 400 }}
              >
                {project.description}
              </p>
            </motion.article>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
