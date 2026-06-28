/*
  screenContent
  ─────────────
  The portfolio, painted as a 2D canvas document that is mapped onto the CRT
  screen mesh's UV island (see MacExperience). Because the mesh is physically
  curved, drawing here makes the content wrap around the glass exactly the way
  an image bends on a real tube monitor — no flat HTML overlay involved.

  Everything is laid out in "document space": (0,0) is the top of the hero, x
  grows right, y grows down, in the screen island's logical pixels. The caller
  fills the base, clips to the island, translates by −scrollY, and calls
  `drawDocument`. `layoutDocument` measures section heights first so scrolling
  can be clamped and per-section backgrounds painted. `drawMenuBar` paints the
  fixed Finder-style bar on top.

  Per-element entrance animations are driven by each section's `age` (ms since
  it entered the viewport) — nothing animates until its section is in view.

  Strict palette only — every colour below is from the approved set.
*/

import {
  HERO,
  ABOUT_CONTENT,
  PROJECTS,
  FUTURE_CONTENT,
  CONTACT_CONTENT,
} from "@/lib/content";

// ── Palette (the only colours used anywhere on the screen) ──
const C = {
  ink: "#001219", // darkest — text, dark backgrounds
  tealDark: "#005F73", // window bars, borders
  teal: "#0A9396", // labels, descriptions
  lightTeal: "#94D2BD", // bevel highlight, grips
  cream: "#E9D8A6", // warm panels, alt backgrounds
  amber: "#EE9B00", // primary accent, project names
  burnt: "#CA6702", // secondary accent, italic
  deepOrange: "#BB3E03", // third window square
  canvas: "#F5F4F0", // primary background
} as const;

// category tags requested by the spec (presentation labels, not new content)
const CATEGORIES: Record<string, string> = {
  "fern.ai": "medical ai",
  pokepy: "language model",
};

// Finder-bar navigation (label + the section it scrolls to)
const MENU: { id: string; label: string }[] = [
  { id: "about", label: "who am i" },
  { id: "projects", label: "projects" },
  { id: "future", label: "future" },
  { id: "contact", label: "connection" },
];

export interface Fonts {
  inter: string; // resolved family string usable in ctx.font
  mono: string;
}

export interface LinkRect {
  href: string;
  x: number;
  y: number; // document space (pre-scroll)
  w: number;
  h: number;
}

export interface MenuRect {
  id: string;
  x: number;
  y: number; // logical (screen-fixed) space
  w: number;
  h: number;
}

export interface SectionBox {
  id: string;
  top: number;
  height: number;
  bg: string;
}

export interface PaintEnv {
  W: number; // island logical width
  H: number; // island logical height (one screen-ful)
  fonts: Fonts;
  heroChars: number; // characters of the hero headline revealed
  heroCaret: boolean; // hero caret visible this frame
  age: Record<string, number>; // sectionId → ms since it entered view
  hoverHref: string | null;
  menuHover: string | null; // hovered nav item id
  clock: string; // current time, HH:MM
}

const SECTIONS: { id: string; bg: string }[] = [
  { id: "hero", bg: C.canvas },
  { id: "about", bg: C.canvas },
  { id: "projects", bg: C.ink },
  { id: "future", bg: C.canvas },
  { id: "contact", bg: C.cream },
];

// ── Easing ──
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Finder-bar height — a taller, proper Macintosh menubar with extra vertical
// room so the labels sit comfortably with space above and below.
export const menuBarH = (W: number) => 50 * (W / 1000);
// Top inset of the bar — dropped a little below the bezel's inner lip so the
// bar sits just inside the top edge with breathing room above the text.
export const menuBarTop = (W: number) => 16 * (W / 1000);
// The content-container left/right edges in logical space — the same inset the
// body content uses (Painter.x0 / pad), i.e. the bezel opening, not the glass.
export const contentInset = (W: number) => 64 * (W / 1000);

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

type Mode = "measure" | "draw";

// ── Painter: either measures (advances y, no pixels) or draws. Both modes
//    share one code path so layout can never diverge. Entrance animations are
//    transform/alpha only, so they never affect measured heights. ──
class Painter {
  ctx: CanvasRenderingContext2D;
  mode: Mode;
  draw: boolean;
  fonts: Fonts;
  W: number;
  u: number; // scale unit = W / 1000
  pad: number;
  x0: number;
  cw: number;
  y = 0;
  age = 1e9; // ms since this section entered view (large ⇒ fully settled)
  links: LinkRect[] = [];

  constructor(ctx: CanvasRenderingContext2D, env: PaintEnv, mode: Mode) {
    this.ctx = ctx;
    this.mode = mode;
    this.draw = mode === "draw";
    this.fonts = env.fonts;
    this.W = env.W;
    this.u = env.W / 1000;
    this.pad = 64 * this.u;
    this.x0 = this.pad;
    this.cw = env.W - 2 * this.pad;
  }

  // local progress 0..1 for an element with `delay`/`dur` (ms) within the section
  prog(delay: number, dur: number) {
    const a = (this.age - delay) / dur;
    return a <= 0 ? 0 : a >= 1 ? 1 : a;
  }

  font(weight: number, sizeU: number, fam: "inter" | "mono", italic = false) {
    const family = fam === "mono" ? this.fonts.mono : this.fonts.inter;
    return `${italic ? "italic " : ""}${weight} ${sizeU * this.u}px ${family}`;
  }

  wrap(text: string, font: string, maxW: number): string[] {
    this.ctx.font = font;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (this.ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  fillRect(x: number, y: number, w: number, h: number, color: string) {
    if (!this.draw) return;
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  // raised (light TL / dark BR) or inset (dark TL / light BR) 2px bevel border
  bevel(x: number, y: number, w: number, h: number, raised = true) {
    if (!this.draw) return;
    this.ctx.shadowBlur = 0;
    const t = Math.max(1, 2 * this.u);
    const tl = raised ? C.lightTeal : C.tealDark;
    const br = raised ? C.tealDark : C.lightTeal;
    this.ctx.fillStyle = tl;
    this.ctx.fillRect(x, y, w, t);
    this.ctx.fillRect(x, y, t, h);
    this.ctx.fillStyle = br;
    this.ctx.fillRect(x, y + h - t, w, t);
    this.ctx.fillRect(x + w - t, y, t, h);
  }

  // text with a faint phosphor bloom (more visible on the dark sections)
  text(
    str: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = "left",
    baseline: CanvasTextBaseline = "top",
    spacingU = 0,
  ) {
    if (!this.draw) return;
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    (this.ctx as unknown as { letterSpacing: string }).letterSpacing = spacingU
      ? `${spacingU * this.u}px`
      : "0px";
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 1.4 * this.u;
    this.ctx.fillText(str, x, y);
    this.ctx.shadowBlur = 0;
    (this.ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  }

  // a block of wrapped paragraphs from `startY`; returns the y after the block.
  // Each paragraph fades up, staggered by `stagger` ms from `animDelay`.
  paras(
    texts: readonly string[],
    x: number,
    startY: number,
    maxW: number,
    sizeU: number,
    weight: number,
    color: string,
    lineMul = 1.8,
    paraGapU = 22,
    fam: "inter" | "mono" = "inter",
    animDelay = 0,
    stagger = 0,
    italic = false,
  ): number {
    const font = this.font(weight, sizeU, fam, italic);
    const lineH = sizeU * this.u * lineMul;
    let yy = startY;
    texts.forEach((tx, i) => {
      if (i > 0) yy += paraGapU * this.u;
      const lines = this.wrap(tx, font, maxW);
      if (this.draw) {
        const pr = this.prog(animDelay + i * stagger, 380);
        const a = Math.min(1, pr * 1.4);
        const ty = (1 - easeOutCubic(pr)) * 16 * this.u;
        this.ctx.save();
        this.ctx.globalAlpha *= a;
        this.ctx.translate(0, ty);
        let ly = yy;
        for (const line of lines) {
          this.text(line, x, ly, font, color);
          ly += lineH;
        }
        this.ctx.restore();
      }
      yy += lines.length * lineH;
    });
    return yy;
  }

  // dashed —·—·— separator, drawing from left to right as it reveals
  divider(y: number, animDelay = 0) {
    if (!this.draw) return;
    const pr = easeOutCubic(this.prog(animDelay, 480));
    this.ctx.save();
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha *= 0.5;
    this.ctx.strokeStyle = C.tealDark;
    this.ctx.lineWidth = Math.max(1, 1.5 * this.u);
    this.ctx.setLineDash([10 * this.u, 7 * this.u]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.x0, y);
    this.ctx.lineTo(this.x0 + this.cw * pr, y);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // window title bar; slides in from the left with a mechanical snap.
  // animDelay < 0 ⇒ no entrance (used for project sub-windows that scale in).
  titleBar(
    label: string,
    opts: { x?: number; w?: number; labelColor?: string; center?: boolean; animDelay?: number } = {},
  ) {
    const x = opts.x ?? this.x0;
    const w = opts.w ?? this.cw;
    const barH = 40 * this.u;
    if (this.draw) {
      const pr = this.prog(opts.animDelay ?? 0, 420);
      const dx = (1 - easeOutBack(pr)) * (-110 * this.u);
      const alpha = Math.min(1, pr * 1.5);
      this.ctx.save();
      this.ctx.globalAlpha *= alpha;
      this.ctx.translate(dx, 0);
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = C.tealDark;
      this.ctx.fillRect(x, this.y, w, barH);
      // three window squares, left
      const sq = 11 * this.u;
      const sgap = 7 * this.u;
      const sy = this.y + barH / 2 - sq / 2;
      [C.amber, C.burnt, C.deepOrange].forEach((c, i) => {
        this.ctx.fillStyle = c;
        this.ctx.fillRect(x + 16 * this.u + i * (sq + sgap), sy, sq, sq);
      });
      // resize grip lines, right
      this.ctx.strokeStyle = C.lightTeal;
      this.ctx.lineWidth = Math.max(1, 1.5 * this.u);
      this.ctx.setLineDash([]);
      const gx = x + w - 16 * this.u;
      const gh = barH * 0.42;
      const gy = this.y + barH / 2 - gh / 2;
      for (let i = 0; i < 3; i++) {
        const lx = gx - i * 5 * this.u;
        this.ctx.beginPath();
        this.ctx.moveTo(lx, gy);
        this.ctx.lineTo(lx, gy + gh);
        this.ctx.stroke();
      }
      // label
      const center = opts.center ?? true;
      const font = this.font(500, 16, "mono");
      if (center) {
        this.text(label, x + w / 2, this.y + barH / 2, font, opts.labelColor ?? C.canvas, "center", "middle", 1.5);
      } else {
        const lx = x + 16 * this.u + 3 * (sq + sgap) + 14 * this.u;
        this.text(label, lx, this.y + barH / 2, font, opts.labelColor ?? C.canvas, "left", "middle", 1.5);
      }
      this.ctx.restore();
    }
    this.y += barH;
  }

  // opening chrome for a content section: breathing space, separator, title bar
  header(label: string) {
    this.y += 52 * this.u;
    this.divider(this.y, 0);
    this.y += 44 * this.u;
    this.titleBar(label, { animDelay: 90 });
    this.y += 44 * this.u;
  }
}

// ── Sections — each assumes p.y is at the section top and advances it. ──

function renderAbout(p: Painter) {
  p.header("WHO AM I");
  const top = p.y;
  const leftW = p.cw * 0.56;
  const gap = p.cw * 0.04;
  const rightW = p.cw * 0.4;
  const rightX = p.x0 + leftW + gap;

  // left column — two body paragraphs (fade up, staggered)
  const leftBottom = p.paras(
    ABOUT_CONTENT.paragraphs,
    p.x0,
    top,
    leftW,
    18,
    400,
    C.ink,
    1.8,
    26,
    "inter",
    220,
    150,
  );

  // right column — "currently exploring" panel
  const padIn = 26 * p.u;
  const labelFont = p.font(500, 12, "mono");
  const exploreFont = p.font(500, 17, "inter");
  const exploreLines = p.wrap(ABOUT_CONTENT.exploring, exploreFont, rightW - 2 * padIn);
  const labelH = 12 * p.u;
  const exploreLineH = 17 * p.u * 1.65;
  const panelH = padIn * 2 + labelH + 22 * p.u + exploreLines.length * exploreLineH;

  if (p.draw) {
    const pr = p.prog(360, 480);
    const a = Math.min(1, pr * 1.3);
    const ty = (1 - easeOutCubic(pr)) * 20 * p.u;
    p.ctx.save();
    p.ctx.globalAlpha *= a;
    p.ctx.translate(0, ty);
    p.fillRect(rightX, top, rightW, panelH, C.cream);
    p.bevel(rightX, top, rightW, panelH, false);
    let ry = top + padIn;
    p.text(ABOUT_CONTENT.exploringLabel.toUpperCase(), rightX + padIn, ry, labelFont, C.tealDark, "left", "top", 2.5);
    ry += labelH + 22 * p.u;
    for (const line of exploreLines) {
      p.text(line, rightX + padIn, ry, exploreFont, C.ink);
      ry += exploreLineH;
    }
    p.ctx.restore();
  }

  p.y = Math.max(leftBottom, top + panelH) + 64 * p.u;
}

function renderProjects(p: Painter) {
  p.header("PROJECTS");
  const padIn = 26 * p.u;
  PROJECTS.forEach((proj, i) => {
    const subTop = p.y;
    const barH = 40 * p.u;
    const descFont = p.font(400, 17, "inter");
    const descLines = p.wrap(proj.description, descFont, p.cw - 2 * padIn);
    const tagH = 14 * p.u;
    const descLineH = 17 * p.u * 1.8;
    const bodyH = padIn * 2 + tagH + 18 * p.u + descLines.length * descLineH;
    const totalH = barH + bodyH;

    if (p.draw) {
      // sub-window scales in with overshoot
      const pr = p.prog(140 + i * 170, 480);
      const s = 0.92 + 0.08 * easeOutBack(pr);
      const a = Math.min(1, pr * 1.4);
      const cx = p.x0 + p.cw / 2;
      const cyc = subTop + totalH / 2;
      p.ctx.save();
      p.ctx.globalAlpha *= a;
      p.ctx.translate(cx, cyc);
      p.ctx.scale(s, s);
      p.ctx.translate(-cx, -cyc);

      p.fillRect(p.x0, subTop + barH, p.cw, bodyH, C.ink);
      p.y = subTop;
      p.titleBar(proj.name, { labelColor: C.amber, center: false, animDelay: -1000 });
      p.bevel(p.x0, subTop, p.cw, totalH, true);

      let by = subTop + barH + padIn;
      p.text((CATEGORIES[proj.name] ?? "").toUpperCase(), p.x0 + padIn, by, p.font(400, 13, "mono"), C.lightTeal, "left", "top", 2);
      by += tagH + 18 * p.u;
      for (const line of descLines) {
        p.text(line, p.x0 + padIn, by, descFont, C.cream);
        by += descLineH;
      }
      p.ctx.restore();
    }
    p.y = subTop + totalH + 38 * p.u;
  });
  p.y += 26 * p.u;
}

function renderFuture(p: Painter) {
  p.header("FUTURE");
  // intro, full width (fade up)
  p.y = p.paras([FUTURE_CONTENT.intro], p.x0, p.y, p.cw, 18, 400, C.ink, 1.8, 22, "inter", 200, 0);
  p.y += 48 * p.u;

  // FIX 2 — a clean structured list (IBM Plex Mono throughout). No indentation:
  // every row is left-aligned with equal weight. A square bullet + area name on
  // one line, the description aligned beneath the name, and an amber left border
  // running the full height of each row. Generous space lets them breathe.
  const nameFont = p.font(600, 20, "mono");
  const descFont = p.font(400, 16, "mono");
  const descLineH = 16 * p.u * 1.7;
  const bulletSize = 7 * p.u; // small ~6px square bullet
  const bulletX = p.x0 + 18 * p.u;
  const nameX = bulletX + bulletSize + 14 * p.u;
  const borderW = Math.max(2, 2 * p.u);
  const nameLineH = 20 * p.u * 1.4;
  FUTURE_CONTENT.items.forEach((item, i) => {
    const itemTop = p.y;
    const descStartY = itemTop + nameLineH + 4 * p.u;
    const descLines = p.wrap(item.description, descFont, p.x0 + p.cw - nameX);
    const itemBottom = descStartY + descLines.length * descLineH;

    if (p.draw) {
      const pr = p.prog(i * 100, 440);
      const a = Math.min(1, pr * 1.4);
      const ty = (1 - easeOutCubic(pr)) * 18 * p.u; // gentle cascade, no staircase
      p.ctx.save();
      p.ctx.globalAlpha *= a;
      p.ctx.translate(0, ty);
      // amber left border, full row height (bullet → end of description)
      p.fillRect(p.x0, itemTop, borderW, itemBottom - itemTop, C.amber);
      // square bullet, centred on the name's line
      p.fillRect(bulletX, itemTop + nameLineH * 0.5 - bulletSize / 2, bulletSize, bulletSize, C.amber);
      // area name, on the bullet's line
      p.text(item.title, nameX, itemTop + nameLineH * 0.5, nameFont, C.ink, "left", "middle");
      // description, aligned under the name
      let ly = descStartY;
      for (const line of descLines) {
        p.text(line, nameX, ly, descFont, C.teal);
        ly += descLineH;
      }
      p.ctx.restore();
    }
    p.y = itemBottom + 52 * p.u; // generous breathing room between items
  });
  p.y += 30 * p.u;
}

function renderContact(p: Painter) {
  p.header("CONNECTION");
  p.y = p.paras([CONTACT_CONTENT.intro], p.x0, p.y, p.cw, 18, 400, C.ink, 1.8, 22, "inter", 180, 0);
  p.y += 40 * p.u;

  const fieldPad = 18 * p.u;
  const valueFont = p.font(500, 20, "inter");
  const labelFont = p.font(500, 12, "mono");
  CONTACT_CONTENT.links.forEach((link, i) => {
    const labelY = p.y;
    const valueY = labelY + 12 * p.u + 14 * p.u;
    const valueH = 20 * p.u + 2 * fieldPad;
    const fieldW = p.cw * 0.72;

    if (p.draw) {
      // letter-spacing collapses wide → normal: a scanning reveal
      const pr = p.prog(i * 130, 480);
      const a = Math.min(1, pr * 1.3);
      const ls = (1 - easeOutCubic(pr)) * 9; // in u-units (text() multiplies by u)
      p.ctx.save();
      p.ctx.globalAlpha *= a;
      p.text(link.label.toUpperCase(), p.x0, labelY, labelFont, C.tealDark, "left", "top", 2.5 + ls);
      p.fillRect(p.x0, valueY, fieldW, valueH, C.canvas);
      p.bevel(p.x0, valueY, fieldW, valueH, false);
      p.text(link.value, p.x0 + fieldPad, valueY + valueH / 2, valueFont, C.ink, "left", "middle", ls);
      p.ctx.restore();
      p.links.push({ href: link.href, x: p.x0, y: valueY, w: fieldW, h: valueH });
    }
    p.y = valueY + valueH + 28 * p.u;
  });

  // closing note — italic burnt orange (fades up last)
  p.y += 6 * p.u;
  p.paras([CONTACT_CONTENT.note], p.x0, p.y, p.cw, 17, 400, C.burnt, 1.8, 22, "inter", 520, 0, true);
  p.y += 17 * p.u * 1.8 + 60 * p.u;
}

function renderSection(p: Painter, id: string) {
  switch (id) {
    case "about":
      return renderAbout(p);
    case "projects":
      return renderProjects(p);
    case "future":
      return renderFuture(p);
    case "contact":
      return renderContact(p);
  }
}

// ── Layout: measure every section, return positioned boxes + total height ──
export function layoutDocument(ctx: CanvasRenderingContext2D, env: PaintEnv) {
  const boxes: SectionBox[] = [];
  let y = 0;
  for (const s of SECTIONS) {
    if (s.id === "hero") {
      boxes.push({ id: "hero", top: 0, height: env.H, bg: s.bg });
      y = env.H;
      continue;
    }
    const p = new Painter(ctx, env, "measure");
    p.y = y;
    renderSection(p, s.id);
    boxes.push({ id: s.id, top: y, height: p.y - y, bg: s.bg });
    y = p.y;
  }
  return { boxes, total: y };
}

// ── Hero — "hi, i'm anay", centred, with the typewriter reveal + amber caret ──
function drawHero(ctx: CanvasRenderingContext2D, env: PaintEnv, box: SectionBox) {
  const u = env.W / 1000;
  const full = HERO.title;
  const shown = full.slice(0, env.heroChars);
  const size = 64 * u;
  ctx.font = `400 ${size}px ${env.fonts.inter}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${-size * 0.02}px`;
  const fullW = ctx.measureText(full).width;
  const startX = env.W / 2 - fullW / 2;
  // centre vertically in the space *below* the navbar, not the whole screen
  const navBottom = menuBarTop(env.W) + menuBarH(env.W);
  const cy = box.top + navBottom + (env.H - navBottom) / 2;
  ctx.shadowColor = C.ink;
  ctx.shadowBlur = 2 * u;
  ctx.fillStyle = C.ink;
  ctx.fillText(shown, startX, cy);
  ctx.shadowBlur = 0;
  if (env.heroCaret) {
    const shownW = ctx.measureText(shown).width;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
    ctx.fillStyle = C.amber;
    ctx.fillRect(startX + shownW + size * 0.05, cy - (size * 0.72) / 2, size * 0.06, size * 0.72);
  }
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
}

// ── Draw the whole document. Caller has already: oriented to the island,
//    clipped to [0,0,W,H], filled the base, and translated by −scrollY. ──
export function drawDocument(
  ctx: CanvasRenderingContext2D,
  env: PaintEnv,
  layout: { boxes: SectionBox[]; total: number },
): LinkRect[] {
  const u = env.W / 1000;
  const links: LinkRect[] = [];

  for (const box of layout.boxes) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = box.bg;
    ctx.fillRect(0, box.top, env.W, box.height);

    if (box.id === "hero") {
      drawHero(ctx, env, box);
      continue;
    }

    const p = new Painter(ctx, env, "draw");
    p.y = box.top;
    p.age = env.age[box.id] ?? 0;
    renderSection(p, box.id);
    for (const l of p.links) links.push(l);
  }

  // hover highlight on contact fields
  if (env.hoverHref) {
    const hit = links.find((l) => l.href === env.hoverHref);
    if (hit) {
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = C.burnt;
      ctx.lineWidth = Math.max(1, 2 * u);
      ctx.strokeRect(hit.x, hit.y, hit.w, hit.h);
      ctx.restore();
    }
  }

  return links;
}

// ── Finder-style menu bar — fixed at the top of the screen, drawn in logical
//    (un-scrolled) space. Returns the clickable nav rects for hit-testing. ──
export function drawMenuBar(ctx: CanvasRenderingContext2D, env: PaintEnv): MenuRect[] {
  const u = env.W / 1000;
  // The bar background bleeds edge to edge (full screen width, no side gaps),
  // exactly like a real Macintosh menubar. The monogram, items and clock are
  // inset from the edges so the CRT's curved corners never clip them.
  const h = menuBarH(env.W);
  const top = menuBarTop(env.W); // flush against the bezel's top inner edge
  const left = contentInset(env.W); // content left  (inside the corner curvature)
  const right = env.W - contentInset(env.W); // content right (inside the curvature)
  // Vertical centre of the labels — nudged down a hair from the geometric
  // middle so the monogram, words and clock sit optically centred in the bar
  // (they were reading slightly top-weighted).
  const mid = top + h / 2 + 3 * u;
  const innerPad = 16 * u;
  const rects: MenuRect[] = [];

  ctx.save();
  ctx.shadowBlur = 0;
  // Pre-tilt the whole bar a hair counter-clockwise about its centre to cancel
  // the apparent downward-right slope from the CRT wrap, leveling it and closing
  // the top-right gap. Negative angle = CCW (canvas y points down).
  const NAV_TILT = -0.004;
  ctx.translate(env.W / 2, mid);
  ctx.rotate(NAV_TILT);
  ctx.translate(-env.W / 2, -mid);
  // bar background — full bleed across the entire screen width, with the top
  // edge overscanned so the CCW tilt never exposes cream above the left end.
  const ovr = 20 * u;
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, top - ovr, env.W, h + ovr);
  // thin teal base line under the bar, full width
  ctx.fillStyle = C.tealDark;
  ctx.fillRect(0, top + h - Math.max(1, 1 * u), env.W, Math.max(1, 1 * u));

  ctx.textBaseline = "middle";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

  // "A" monogram, at the content's left inset
  ctx.font = `700 ${17 * u}px ${env.fonts.mono}`;
  ctx.textAlign = "left";
  ctx.shadowColor = C.amber;
  ctx.shadowBlur = 1.6 * u;
  ctx.fillStyle = C.amber;
  ctx.fillText("A", left + innerPad, mid);
  const aw = ctx.measureText("A").width;
  ctx.shadowBlur = 0;

  // nav items, generously spaced, with "·" separators
  const navFont = `500 ${14 * u}px ${env.fonts.mono}`;
  ctx.font = navFont;
  const padX = 12 * u;
  let x = left + innerPad + aw + 26 * u;
  MENU.forEach((m, i) => {
    if (i > 0) {
      ctx.fillStyle = hexA(C.lightTeal, 0.45);
      ctx.textAlign = "center";
      ctx.fillText("·", x + 9 * u, mid);
      x += 18 * u;
    }
    const tw = ctx.measureText(m.label).width;
    const itemW = tw + 2 * padX;
    if (env.menuHover === m.id) {
      ctx.fillStyle = C.tealDark; // classic Mac menu hover
      ctx.fillRect(x, top, itemW, h);
    }
    ctx.fillStyle = C.canvas;
    ctx.textAlign = "left";
    ctx.shadowColor = C.canvas;
    ctx.shadowBlur = 1.2 * u;
    ctx.fillText(m.label, x + padX, mid);
    ctx.shadowBlur = 0;
    rects.push({ id: m.id, x, y: top, w: itemW, h });
    x += itemW;
  });

  // clock, at the content's right inset
  ctx.font = `500 ${14 * u}px ${env.fonts.mono}`;
  ctx.fillStyle = C.lightTeal;
  ctx.textAlign = "right";
  ctx.shadowColor = C.lightTeal;
  ctx.shadowBlur = 1.2 * u;
  ctx.fillText(env.clock, right - innerPad, mid);
  ctx.shadowBlur = 0;
  ctx.restore();

  return rects;
}
