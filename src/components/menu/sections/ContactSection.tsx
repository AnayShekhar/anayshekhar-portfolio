import { CONTACT_CONTENT } from "@/lib/content";

export function ContactSection() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-body">
      <p>{CONTACT_CONTENT.intro}</p>
      <ul className="space-y-3">
        {CONTACT_CONTENT.links.map((link) => (
          <li key={link.label}>
            <span className="font-mono text-xs text-mono-tag">{link.label}: </span>
            <a
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              className="text-header underline decoration-border underline-offset-4 transition-colors hover:decoration-body"
            >
              {link.value}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
