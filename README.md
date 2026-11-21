# Anay Shekhar

A minimal, responsive personal portfolio built with HTML, CSS, and GSAP. The original biography, interests, project descriptions, awards, and social destinations are preserved.

## Preview

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000. There is no build step or package installation. Deploy the repository as a static site.

## Motion and assets

- `script.js`: GSAP entrance animations, scroll reveals, and a reversible, coarse pixel wipe with a narrow edge and cutout cells from the hero to the about section. Native wheel and trackpad scrolling are preserved.
- `assets/vendor/ascii-overlay.js`: the supplied Annnimate WebGL overlay, adapted to show the supplied mountain photograph, pause offscreen, and retain a photograph fallback if WebGL is unavailable. The hero uses `data-anm-coverage="full"` to place a dense, tone-aware character field across the terrain and sky instead of masking out the mountain as a foreground subject.
- `assets/vendor/dual-scramble.js`: the supplied Annnimate two-phase text scramble, also triggered by keyboard focus on links.
- GSAP 3.14.2, ScrollTrigger, ScrambleTextPlugin, and Three.js r128 are served locally. Library license headers are retained.
- DM Sans and IBM Plex Mono fonts are served locally. Font licenses are in `assets/fonts/`.
- `assets/mountain.avif` is the user-supplied hero photograph. Project symbols are unboxed ASCII illustrations: an orbiting planet, clicking pointer, leaf, and neural network. `ascii-symbols.js` draws the characters, with static HTML fallbacks and visibility-aware animation at 12 fps.

The pinned wipe runs on screens wider than 700px and at least 660px high. Smaller screens use a natural stacked layout. Reduced-motion preferences disable animated entrances, scrambling, and the ASCII animation; all content remains accessible with JavaScript disabled.

## Mobile performance

Phones (including landscape touch screens), viewports up to 700px, reduced-motion preferences, and connections reporting Save-Data or 2G use a lightweight static page. `motion-loader.js` skips all animation dependencies in this mode. System fonts and a text-only hero avoid custom font and photograph downloads; project artwork uses the static ASCII already in the HTML. Navigation uses native anchor links and no smooth scrolling. Google Analytics remains enabled.

Desktop visitors with a fine pointer keep the animated design. The loader downloads scripts in parallel and executes them in dependency order. If JavaScript is disabled, the content and navigation remain usable, with no mobile font or photograph downloads.
