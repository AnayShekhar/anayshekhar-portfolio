import { motion } from "framer-motion";
import { CONTACT_CONTENT, SECTION_TITLES } from "@/lib/content";
import { revealContainer, revealItem, revealTitle } from "./reveal";

// "connection" — warm and personal (sits on #E9D8A6). Title, intro, then contact
// items as data fields: mono teal label over a value that shifts to burnt orange
// on hover. Closes with an italic note + a centred mono footer.
export function ContactSection() {
  return (
    <motion.div variants={revealContainer} className="space-y-12">
      <motion.h2
        variants={revealTitle}
        className="t-title font-sans font-normal leading-[1.05]"
        style={{ color: "#001219", letterSpacing: "-0.02em" }}
      >
        {SECTION_TITLES.contact}
      </motion.h2>

      <motion.p
        variants={revealItem}
        className="t-body font-sans leading-[1.85]"
        style={{ color: "#001219", fontWeight: 400 }}
      >
        {CONTACT_CONTENT.intro}
      </motion.p>

      <motion.div variants={revealContainer} className="space-y-10">
        {CONTACT_CONTENT.links.map((link) => (
          <motion.div key={link.label} variants={revealItem}>
            <div
              className="t-mono font-mono uppercase"
              style={{ color: "#005F73", letterSpacing: "0.25em" }}
            >
              {link.label}
            </div>
            <a
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"
              }
              className="contact-value mt-2 inline-block font-sans"
              style={{
                fontWeight: 500,
                letterSpacing: "-0.01em",
                fontSize: "calc(var(--sw, 100vw) * 0.022)",
              }}
            >
              {link.value}
            </a>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        variants={revealItem}
        className="t-body pt-4 font-sans italic"
        style={{ color: "#CA6702", fontWeight: 400 }}
      >
        {CONTACT_CONTENT.note}
      </motion.p>

      <motion.div
        variants={revealItem}
        className="t-mono pt-8 text-center font-mono"
        style={{ color: "#005F73", letterSpacing: "0.1em" }}
      >
        anay shekhar
      </motion.div>
    </motion.div>
  );
}
