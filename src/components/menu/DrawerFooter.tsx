import { FOOTER_LINKS } from "@/lib/content";

export function DrawerFooter() {
  return (
    <footer className="drawer-footer-socials border-t border-drawer-text/10 pt-4">
      <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-drawer-text/60 sm:text-sm">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={link.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
            className="transition-colors hover:text-drawer-text"
            aria-label={link.label}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
