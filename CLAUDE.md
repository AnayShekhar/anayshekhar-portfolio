# CLAUDE.md

## WHAT THIS SITE IS

A minimal, static personal research portfolio, in the style of karpathy.ai.

Plain HTML and CSS. No framework, no build step, no JavaScript.

`index.html` + `style.css` is the entire site. Nothing else should be added
to serve or build it — no package.json, no bundler, no framework.

## MOST IMPORTANT RULE

DO NOT INVENT CONTENT. DO NOT REWRITE CONTENT. DO NOT ADD SECTIONS.
DO NOT ADD PROJECTS, STATS, TESTIMONIALS, OR TIMELINES.

The content in `index.html` is final. Treat it as immutable unless the user
explicitly gives new copy. Your job is presentation, not authorship.

## DESIGN CONSTRAINTS

- Single page, no navigation bar — just scroll.
- White / off-white background, black or dark gray text. No color accents
  beyond the link color.
- System font stack (or a simple serif/sans pairing). No custom display
  fonts, no web font loading.
- No hero image, no illustrations, no animations, no transitions.
- Generous whitespace, narrow content column (~650–700px, centered).
- Links are plain underlined text — no button styling.
- Mobile responsive by default (single column already handles this).

## CONTENT STRUCTURE

1. Name as a heading, one-line identity underneath.
2. About paragraph(s) + "currently exploring" bullets.
3. Projects — bold title, then a plain paragraph. No cards, no grid, no images.
4. Future / research direction — heading, paragraph, bullet list.
5. Contact — email, github, linkedin as plain text links, one per line.
6. Small footer note.

No additional sections unless the user asks.

## TECHNICAL REQUIREMENTS

- Plain HTML and CSS only. No JS required, no build step.
- Should load instantly — no external font or asset dependencies beyond
  system fonts.
- Semantic HTML: real headings, paragraph tags, lists, not `div` soup.

## HISTORY

This was previously a Next.js + Three.js site (a 3D Macintosh you scrolled
inside of). It was fully replaced with this static page. If you find
references to that in old commits, they're historical — don't resurrect it
unless explicitly asked.
