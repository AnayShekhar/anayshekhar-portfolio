import { motion } from "framer-motion";
import { ABOUT_CONTENT, SECTION_TITLES } from "@/lib/content";
import { revealContainer, revealItem, revealTitle } from "./reveal";

// "who am i?" — title + hairline rule, then a 56/40 split: body prose beside a
// cream "currently exploring" panel with an amber edge. No chrome, no dots.
export function AboutSection() {
  return (
    <motion.div variants={revealContainer}>
      <motion.h2
        variants={revealTitle}
        className="t-title font-sans font-normal leading-[1.05]"
        style={{ color: "#001219", letterSpacing: "-0.02em" }}
      >
        {SECTION_TITLES.about}
      </motion.h2>

      {/* thin rule below the title */}
      <motion.div
        variants={revealItem}
        className="mt-5"
        style={{ height: 1, background: "#94D2BD" }}
      />

      <div className="mt-12 flex flex-col gap-10 md:flex-row md:gap-[4%]">
        {/* left 56% — body paragraphs */}
        <motion.div variants={revealItem} className="space-y-6 md:basis-[56%]">
          {ABOUT_CONTENT.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="t-body font-sans leading-[1.85]"
              style={{ color: "#001219", fontWeight: 400 }}
            >
              {paragraph}
            </p>
          ))}
        </motion.div>

        {/* right 40% — currently exploring panel */}
        <motion.div
          variants={revealItem}
          className="rounded-[8px] md:basis-[40%]"
          style={{
            background: "#E9D8A6",
            borderLeft: "3px solid #EE9B00",
            padding: "5%",
          }}
        >
          <p
            className="t-mono font-mono uppercase"
            style={{ color: "#005F73", letterSpacing: "0.22em" }}
          >
            {ABOUT_CONTENT.exploringLabel}
          </p>
          <p
            className="mt-4 font-sans leading-[1.6]"
            style={{
              color: "#001219",
              fontWeight: 500,
              fontSize: "calc(var(--sw, 100vw) * 0.021)",
            }}
          >
            {ABOUT_CONTENT.exploring}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
