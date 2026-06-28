import { motion } from "framer-motion";
import { FUTURE_CONTENT, SECTION_TITLES } from "@/lib/content";
import { revealContainer, revealItem, revealTitle } from "./reveal";

// Title + full-width intro, then the three research areas as a staircase —
// indented 0 / 10 / 20% so they read as "going deeper", each marked by a thin
// amber edge. No background panels.
const INDENT = [0, 10, 20];

export function FutureSection() {
  return (
    <motion.div variants={revealContainer} className="space-y-12">
      <motion.h2
        variants={revealTitle}
        className="t-title font-sans font-normal leading-[1.05]"
        style={{ color: "#001219", letterSpacing: "-0.02em" }}
      >
        {SECTION_TITLES.future}
      </motion.h2>

      <motion.p
        variants={revealItem}
        className="t-body font-sans leading-[1.85]"
        style={{ color: "#001219", fontWeight: 400 }}
      >
        {FUTURE_CONTENT.intro}
      </motion.p>

      <motion.div variants={revealContainer} className="space-y-10">
        {FUTURE_CONTENT.items.map((item, i) => (
          <motion.div
            key={item.title}
            variants={revealItem}
            className="pl-5"
            style={{
              marginLeft: `${INDENT[i] ?? 0}%`,
              borderLeft: "2px solid #EE9B00",
            }}
          >
            <h4
              className="font-sans leading-tight"
              style={{
                color: "#001219",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                fontSize: "calc(var(--sw, 100vw) * 0.026)",
              }}
            >
              {item.title}
            </h4>
            <p
              className="t-body mt-2 font-sans leading-[1.7]"
              style={{ color: "#0A9396", fontWeight: 400 }}
            >
              {item.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
