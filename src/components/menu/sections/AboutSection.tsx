import { ABOUT_CONTENT } from "@/lib/content";

export function AboutSection() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-body">
      {ABOUT_CONTENT.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
      ))}
    </div>
  );
}
