import { ABOUT_CONTENT } from "@/lib/content";

export function AboutSection() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-body">
      {ABOUT_CONTENT.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
      ))}

      <p className="border-t border-border pt-5">
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-mono-tag">
          {ABOUT_CONTENT.exploringLabel}
        </span>
        <br />
        <span className="text-header">{ABOUT_CONTENT.exploring}</span>
      </p>
    </div>
  );
}
