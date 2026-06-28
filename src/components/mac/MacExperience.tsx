"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createMacAudio } from "./macAudio";
import {
  layoutDocument,
  drawDocument,
  drawMenuBar,
  menuBarH,
  menuBarTop,
  type PaintEnv,
  type LinkRect,
  type MenuRect,
  type Fonts,
} from "./screenContent";

/*
  MacExperience
  ─────────────
  A persistent Three.js layer that frames the entire site inside a Mac bezel.

  The scene is created once and lives for the whole session. The only teardown
  is the React-unmount guard so we don't leak a second canvas under Strict Mode.

  There is a single full-viewport <canvas> (z-index 0): the Mac model plus a
  screen texture. Everything outside the bezel is pure black (the abyss). There
  is NO HTML overlay — both the intro AND the portfolio are drawn onto an
  offscreen 2D canvas (2048×1536) that is used only as a CanvasTexture mapped
  onto the Computer_Screen_0 mesh, so the content is physically part of the
  curved glass and the bezel is the real 3D geometry framing it. Pointer/scroll
  interaction is resolved by raycasting the screen mesh and mapping the hit UV
  back into canvas pixels (see pointerToLogical).

  The whole intro is driven by a single requestAnimationFrame loop tracking
  elapsed milliseconds — no setTimeout chains.
*/

// ── Master timeline (ms) ──
// Stage 1: 0–500 wide shot of the full Mac.
// Stage 2: zoom pushes in 500 → 3000.
const ZOOM_START = 500;
const ZOOM_DUR = 2500;
const ZOOM_END = ZOOM_START + ZOOM_DUR; // 3000
// A tiny camera roll (radians) about the view axis to level the slightly-tilted
// render. Negative ⇒ the whole scene rotates counter-clockwise on screen.
const VIEW_ROLL = -0.012;

// Screen content sequence (rendered on the canvas texture):
// FIX 1 — slow CRT warm-up: flashes ~150ms on / ~100ms off, ~900ms total.
const FLICKER_START = 500;
const FLICKER_DUR = 900;
const SETTLE = FLICKER_START + FLICKER_DUR; // 1400 — black + blinking cursor

// ── Screen text sequence — begins the moment the monitor has warmed up. No
//    boot hint / sound prompt: the screen is confident enough to begin. ──
const SEQ_START = SETTLE; // 1400
const CONFUSE = "who am i";
const CONFUSE_LEN = CONFUSE.length; // 8

// Phase 1 — confusion: three failing attempts to say "who am i".
const A1_TYPE_END = SEQ_START + CONFUSE_LEN * 150; // 4200 (150ms/char)
const A1_GLITCH_START = A1_TYPE_END + 400; // 4600 (pause)
const A1_GLITCH_END = A1_GLITCH_START + 1500; // 6100
const A2_TYPE_START = A1_GLITCH_END; // 6100
const A2_TYPE_END = A2_TYPE_START + CONFUSE_LEN * 80; // 6740 (80ms/char)
const A2_GLITCH_END = A2_TYPE_END + 1000; // 7740
const A3_TYPE_START = A2_GLITCH_END; // 7740
const A3_TYPE_END = A3_TYPE_START + 120; // 7860 (just "w")
const A3_COLLAPSE_END = A3_TYPE_END + 800; // 8660

// Phase 2 — resolution: decelerating noise → cleared, silent screen.
const RES_END = A3_COLLAPSE_END + 600; // 9260
const SILENCE_END = RES_END + 300; // 9560

// Phase 3 — modern takeover: the canvas fades to cream while the *real* HTML
// hero mounts and types underneath. Nothing is drawn on the canvas after this —
// the hero is live DOM at full resolution, not a canvas render.
const SITE_REVEAL = SILENCE_END; // 9560 — mount + fade in the HTML site
const BG_FADE_END = SILENCE_END + 400; // 9960 (canvas black → cream)

// ── Screen texture — 2× supersampled (2048×1536) so text stays sharp even
//    wrapped onto the curved CRT mesh. All draw coords scale with RES. ──
const RES = 2;
const TEX_W = 1024 * RES; // 2048
const TEX_H = 768 * RES; // 1536
const PAD_L = 40 * RES; // top-left padding
const PAD_T = 60 * RES;
const FONT_PX = 28 * RES;
const MONO_FONT = `${FONT_PX}px ui-monospace, "SF Mono", Menlo, monospace`;
const CURSOR_W = 14 * RES;
const CURSOR_H = 28 * RES;
const CREAM = "#f5f4f0";
const PHOSPHOR = "#00ff41"; // green CRT phosphor
const GLITCH_SET = "!@#$%^&*<>?/\\|~";

// ── Content (post-intro) — painted onto the screen mesh texture, not a DOM
//    overlay, so it wraps with the CRT glass the same way the intro does. ──
const SCROLL_EASE = 95; // smoothing time-constant for wheel scrolling (ms)
const REVEAL_TRIGGER = 0.82; // a section starts animating when its top crosses this

// Hero typewriter — slow and cinematic, with a 0.7s breath after "hi".
const HERO_TITLE = "hi, i'm anay";
const HERO_DELAY = 460; // before the first glyph
const HERO_HI_STEP = 200; // "hi" — unhurried
const HERO_PAUSE = 700; // the deliberate pause after "hi"
const HERO_REST_STEP = 165; // the remainder
const HERO_TIMES: number[] = (() => {
  const t: number[] = [];
  let cur = HERO_DELAY;
  for (let i = 0; i < HERO_TITLE.length; i++) {
    t.push(cur);
    const ch = HERO_TITLE[i];
    const base = i < 2 ? HERO_HI_STEP : HERO_REST_STEP;
    cur += ch === "," || ch === " " || ch === "'" ? Math.round(base * 0.55) : base;
    if (i === 1) cur += HERO_PAUSE; // 0.7s breath right after "hi"
  }
  return t;
})();

// ── Key press ──
const KEY_DEPTH = 0.02; // units the key travels down
const KEY_RATE = KEY_DEPTH / 60; // full travel over 60ms

// Easing requested by the spec: t<0.5 ? 2t² : -1+(4-2t)t
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

// event.code → mesh name. Letters/digits are derived; the rest are explicit.
const CODE_MAP: Record<string, string> = {
  Space: "Space_Keys_0",
  Enter: "Return_Keys_0",
  NumpadEnter: "Enter_Keys_0",
  Backspace: "Backspace_Keys_0",
  Tab: "Tab_Keys_0",
  CapsLock: "CapLock_Keys_0",
  ShiftLeft: "Shift_Keys_0",
  ShiftRight: "Shift.001_Keys_0",
  AltLeft: "Option_Keys_0",
  AltRight: "Option.001_Keys_0",
  MetaLeft: "Start_Keys_0",
  MetaRight: "Start_Keys_0",
  ContextMenu: "Start_Keys_0",
  Backquote: "~_Keys_0",
  Minus: "-_Keys_0",
  Equal: "+_Keys_0",
  BracketLeft: "[_Keys_0",
  BracketRight: "]_Keys_0",
  Semicolon: ";_Keys_0",
  Quote: "'_Keys_0",
  Comma: "<_Keys_0",
  Period: ">_Keys_0",
  Slash: "/_Keys_0",
};

function codeToMesh(code: string): string | undefined {
  if (/^Key[A-Z]$/.test(code)) return `${code.slice(3)}_Keys_0`;
  if (/^Digit[0-9]$/.test(code)) return `${code.slice(5)}_Keys_0`;
  if (/^Numpad[0-9]$/.test(code)) return `${code.slice(6)}_Keys_0`;
  return CODE_MAP[code];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function hexA(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${Math.round(ca[0] + (cb[0] - ca[0]) * t)}, ${Math.round(
    ca[1] + (cb[1] - ca[1]) * t,
  )}, ${Math.round(ca[2] + (cb[2] - ca[2]) * t)})`;
}

// authentic warm-up: ~150ms-on / ~100ms-off flashes building over ~900ms
const FLASH_WINDOWS: Array<[number, number]> = [
  [0, 150],
  [250, 420],
  [520, 690],
  [790, 900],
];
const isFlashOn = (f: number) => FLASH_WINDOWS.some(([a, b]) => f >= a && f < b);

interface KeyState {
  mesh: THREE.Object3D;
  baseY: number;
  offset: number;
}

export default function MacExperience() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;

    // ── Audio (Web Audio only) — unlocked silently on first user gesture ──
    const audio = createMacAudio();
    const unlock = () => audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── Scene + camera ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000"); // FIX 4 — the abyss is black

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      2000,
    );
    camera.position.set(0, 0, 5);

    // ── Lights — a dark studio. Warm amber key, dim cool fill, white rim.
    //    Positions are refined once the model's bounds are known. ──
    const keyLight = new THREE.PointLight(0xffb347, 0.8);
    keyLight.decay = 0; // stable intensity regardless of distance
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.15);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    scene.add(keyLight, fillLight, rimLight, fillLight.target, rimLight.target);

    // ── Screen glow — a soft spotlight that bleeds the screen's colour onto the
    //    bezel ("casts light into the room"). The screen itself is unlit
    //    MeshBasic, so this never washes the text. Pulses very subtly. ──
    const glow = new THREE.SpotLight(0x00ff41, 0.2, 0, Math.PI / 4, 1, 0);
    scene.add(glow, glow.target);

    // ── Screen texture ──
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = TEX_W;
    screenCanvas.height = TEX_H;
    const sctx = screenCanvas.getContext("2d")!;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    // FIX 1 — sharpness: linear filtering + max anisotropy (the wrap stays).
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;
    screenTexture.generateMipmaps = false;
    screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    sctx.fillStyle = "#000000";
    sctx.fillRect(0, 0, TEX_W, TEX_H);
    screenTexture.needsUpdate = true;

    // Draw inside the screen's UV island, correctly oriented. All `draw`
    // coordinates are "logical" (0,0 = screen top-left, x→right, y→down).
    function withOrientation(draw: () => void) {
      sctx.save();
      sctx.setTransform(...texMatrix);
      draw();
      sctx.restore();
    }

    // white monospace terminal line with a faint green phosphor halo
    function termText(str: string, fg: number) {
      if (!str) return;
      sctx.textAlign = "left";
      sctx.textBaseline = "top";
      sctx.font = MONO_FONT;
      const tw = sctx.measureText(str).width;
      // phosphor: redraw at 120% size, 5% green, centred on the glyphs
      sctx.font = `${FONT_PX * 1.2}px ui-monospace, "SF Mono", Menlo, monospace`;
      sctx.fillStyle = hexA(PHOSPHOR, 0.05 * fg);
      sctx.fillText(str, PAD_L - tw * 0.1, PAD_T - FONT_PX * 0.1);
      // crisp white text
      sctx.font = MONO_FONT;
      sctx.fillStyle = hexA("#ffffff", fg);
      sctx.fillText(str, PAD_L, PAD_T);
    }

    // CRT post-effects in logical (oriented) space — terminal phase only
    function crtOverlay() {
      sctx.fillStyle = "rgba(0,0,0,0.15)";
      for (let y = 0; y < logicalH; y += 4 * RES) {
        sctx.fillRect(0, y, logicalW, RES); // 1px (×RES) scan line every 4px
      }
      // soft vignette — hints at CRT curvature (the screen mesh is itself
      // curved, which supplies the real ~barrel geometry).
      const cx = logicalW / 2;
      const cy = logicalH / 2;
      const vg = sctx.createRadialGradient(
        cx,
        cy,
        Math.min(logicalW, logicalH) * 0.35,
        cx,
        cy,
        Math.max(logicalW, logicalH) * 0.62,
      );
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.4)");
      sctx.fillStyle = vg;
      sctx.fillRect(0, 0, logicalW, logicalH);
    }

    // blinking white block cursor trailing the terminal text
    function termCursor(str: string, elapsed: number, fg: number) {
      if (elapsed % 1060 >= 530) return;
      sctx.font = MONO_FONT;
      const tw = str ? sctx.measureText(str).width + 4 : 0;
      sctx.fillStyle = hexA("#ffffff", fg);
      sctx.fillRect(PAD_L + tw, PAD_T, CURSOR_W, CURSOR_H);
    }

    // re-corrupt `glitchStr` no more often than `interval`ms (elapsed-driven)
    function stepGlitch(elapsed: number, interval: number, gen: () => string) {
      if (elapsed >= glitchNextAt) {
        glitchNextAt = elapsed + interval;
        glitchStr = gen();
        if (elapsed - glitchSoundAt >= 70) {
          audio.glitch(); // electrical interference on each corruption
          glitchSoundAt = elapsed;
        }
      }
    }
    function corrupt(base: string, count: number) {
      const chars = base.split("");
      for (let k = 0; k < count; k++) {
        const p = (Math.random() * base.length) | 0;
        if (base[p] === " ") continue;
        chars[p] = GLITCH_SET[(Math.random() * GLITCH_SET.length) | 0];
      }
      return chars.join("");
    }
    function noise(width: number) {
      let s = "";
      for (let i = 0; i < width; i++)
        s += GLITCH_SET[(Math.random() * GLITCH_SET.length) | 0];
      return s;
    }

    function drawScreen(elapsed: number) {
      // ── background (untransformed, full canvas) ──
      let bg = "#000000";
      if (elapsed >= FLICKER_START && elapsed < SETTLE) {
        bg = isFlashOn(elapsed - FLICKER_START) ? "#d7d7cf" : "#050505";
      } else if (elapsed >= BG_FADE_END) {
        bg = CREAM;
      } else if (elapsed >= SILENCE_END) {
        bg = mixHex("#000000", CREAM, (elapsed - SILENCE_END) / 400); // black → cream
      }
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.fillStyle = bg;
      sctx.fillRect(0, 0, TEX_W, TEX_H);

      const fg = 1; // canvas content is always opaque; the HTML takes over later

      withOrientation(() => {
        if (elapsed < SETTLE) {
          // monitor still warming up — no content yet
        } else if (elapsed >= SILENCE_END) {
          // ── Phase 3 — the mesh fades to cream; the portfolio then takes over
          //    on this same screen texture (see drawContentScreen). ──
        } else if (elapsed < A1_TYPE_END) {
          // Phase 1 · attempt 1 — type "who am i" (150ms/char)
          const c = Math.min(CONFUSE_LEN, Math.floor((elapsed - SEQ_START) / 150));
          const s = CONFUSE.slice(0, c);
          termText(s, fg);
          termCursor(s, elapsed, fg);
        } else if (elapsed < A1_GLITCH_START) {
          termText(CONFUSE, fg); // 400ms pause, full word + cursor
          termCursor(CONFUSE, elapsed, fg);
        } else if (elapsed < A1_GLITCH_END) {
          // glitch: 2–3 positions every 40ms for 1.5s
          stepGlitch(elapsed, 40, () => corrupt(CONFUSE, 2 + ((Math.random() * 2) | 0)));
          termText(glitchStr, fg);
        } else if (elapsed < A2_TYPE_END) {
          // attempt 2 — retype faster (80ms/char)
          const c = Math.min(CONFUSE_LEN, Math.floor((elapsed - A2_TYPE_START) / 80));
          const s = CONFUSE.slice(0, c);
          termText(s, fg);
          termCursor(s, elapsed, fg);
        } else if (elapsed < A2_GLITCH_END) {
          // glitch harder: every char, every 30ms for 1s
          stepGlitch(elapsed, 30, () => noise(CONFUSE_LEN));
          termText(glitchStr, fg);
        } else if (elapsed < A3_TYPE_END) {
          // attempt 3 — only "w"
          termText("w", fg);
          termCursor("w", elapsed, fg);
        } else if (elapsed < A3_COLLAPSE_END) {
          // full collapse: every char random, cycling rapidly for 800ms
          stepGlitch(elapsed, 30, () => noise(CONFUSE_LEN));
          termText(glitchStr, fg);
        } else if (elapsed < RES_END) {
          // ── Phase 2 — resolution: corruption decelerates 30ms → ~300ms ──
          const p = (elapsed - A3_COLLAPSE_END) / 600; // 0 → 1
          const interval = 30 + 270 * p * p;
          stepGlitch(elapsed, interval, () => noise(CONFUSE_LEN));
          termText(glitchStr, fg);
        } else {
          // 300ms silence — cleared black screen, just the blinking cursor
          termCursor("", elapsed, fg);
        }

        // CRT scanlines + vignette over the terminal phase only (until cream)
        if (elapsed >= SETTLE && elapsed < SILENCE_END) crtOverlay();
      });

      screenTexture.needsUpdate = true;
    }

    // ── Model state, resolved on load ──
    let model: THREE.Object3D | null = null;
    const modelCenter = new THREE.Vector3();
    const screenCenter = new THREE.Vector3();
    const screenNormal = new THREE.Vector3(0, 0, 1);
    const screenRightDir = new THREE.Vector3(1, 0, 0);
    const screenUpDir = new THREE.Vector3(0, 1, 0);
    let screenW = 1;
    let screenH = 1;
    const modelBox = new THREE.Box3();

    const startCamPos = new THREE.Vector3();
    const finalCamPos = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    const keyStates = new Map<string, KeyState>();
    const pressed = new Set<string>();

    // Orientation + UV-island mapping for the screen texture (resolved on load).
    // The screen mesh's UVs occupy a rotated sub-rectangle of the texture, so we
    // draw through this transform to land exactly on the visible glass.
    let logicalW = TEX_W;
    let logicalH = TEX_H;
    let texMatrix: [number, number, number, number, number, number] = [
      1, 0, 0, 1, 0, 0,
    ];
    let glitchStr = "";
    let glitchNextAt = 0;
    let glitchSoundAt = 0;

    // ── Content-mode state — the portfolio is drawn into the screen texture's
    //    logical island space (see screenContent), identical to how the intro
    //    renders onto the mesh. All hit-test rects are in those logical px. ──
    let screenMeshObj: THREE.Mesh | null = null;
    let scrollY = 0; // smoothed scroll position
    let targetScroll = 0; // wheel/touch target
    let maxScroll = 0; // clamp (total content height − one screen)
    const age: Record<string, number> = {}; // sectionId → ms since it entered view
    const sectionTops: Record<string, number> = {}; // sectionId → document top
    let contentLinks: LinkRect[] = []; // contact-link hit areas (logical px)
    let menuRects: MenuRect[] = []; // Finder-bar nav hit areas (logical px)
    let hoverHref: string | null = null;
    let menuHover: string | null = null;
    let lastHeroChars = 0;

    // Font families resolved from next/font's CSS variables so the canvas draws
    // real Inter / IBM Plex Mono (falls back to system fonts until they load).
    const fonts: Fonts = { inter: '"Inter", system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace' };
    if (typeof window !== "undefined") {
      const cs = getComputedStyle(document.documentElement);
      const fi = cs.getPropertyValue("--font-inter").trim();
      const fm = cs.getPropertyValue("--font-plex-mono").trim();
      if (fi) fonts.inter = `${fi}, Inter, system-ui, sans-serif`;
      if (fm) fonts.mono = `${fm}, "IBM Plex Mono", ui-monospace, monospace`;
      // Pre-load the real families at the sizes we draw so the first painted
      // frame already has Inter / IBM Plex Mono (not the system fallback).
      void document.fonts.load(`400 64px ${fonts.inter}`);
      void document.fonts.load(`500 16px ${fonts.mono}`);
      void document.fonts.ready;
    }

    // ── Interactivity — raycast the pointer against the screen mesh, read the
    //    hit UV, and map it back into logical canvas px (inverse of texMatrix).
    //    This is the only correct mapping now that content lives ON the mesh. ──
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    // texMatrix maps logical (lx,ly) → texture px; invert it to go back.
    function texToLogical(tx: number, ty: number): { x: number; y: number } {
      const [a, b, c, d, e, f] = texMatrix;
      const det = a * d - b * c || 1;
      return {
        x: (d * (tx - e) - c * (ty - f)) / det,
        y: (-b * (tx - e) + a * (ty - f)) / det,
      };
    }

    // pointer (CSS px) → logical canvas coords on the screen island, or null if
    // the ray misses the glass.
    function pointerToLogical(clientX: number, clientY: number): { x: number; y: number } | null {
      if (!screenMeshObj) return null;
      ndc.x = (clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(screenMeshObj, false)[0];
      const uv = hit?.uv;
      if (!uv) return null;
      // CanvasTexture is flipY, so v is mirrored relative to canvas rows.
      return texToLogical(uv.x * TEX_W, (1 - uv.y) * TEX_H);
    }
    function findMenu(clientX: number, clientY: number): MenuRect | null {
      const p = pointerToLogical(clientX, clientY);
      if (!p) return null;
      for (const m of menuRects) {
        if (p.x >= m.x && p.x <= m.x + m.w && p.y >= m.y && p.y <= m.y + m.h) return m;
      }
      return null;
    }
    function findLink(clientX: number, clientY: number): LinkRect | null {
      const p = pointerToLogical(clientX, clientY);
      if (!p) return null;
      const dy = p.y + scrollY; // content → document space
      for (const l of contentLinks) {
        if (p.x >= l.x && p.x <= l.x + l.w && dy >= l.y && dy <= l.y + l.h) return l;
      }
      return null;
    }

    // ── Ambient dust particles (wide shot only) ──
    const DUST = 36;
    const dustPos = new Float32Array(DUST * 3);
    const dustVel = new Float32Array(DUST * 3); // vx, vy (per ms), vz unused
    const dustExtent = new THREE.Vector3();
    let dust: THREE.Points | null = null;
    let dustMat: THREE.PointsMaterial | null = null;

    const GLOW_GREEN = new THREE.Color(0x00ff41);
    const GLOW_CREAM = new THREE.Color(CREAM);

    // contain-fit distance: how far back to see a (w×h) rect with `pad` margin
    function fitDistance(w: number, h: number, pad: number) {
      const aspect = window.innerWidth / window.innerHeight;
      const vfov = (camera.fov * Math.PI) / 180;
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
      const dH = h / 2 / Math.tan(vfov / 2);
      const dW = w / 2 / Math.tan(hfov / 2);
      return Math.max(dH, dW) * pad;
    }

    // Authentic vintage-CRT panel feel over the content, drawn in the screen's
    // logical island space (w×h logical px, not scrolled) so it reads as the
    // glass, not the page, and wraps with the mesh like everything else.
    function contentCrt(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
      ctx.save();
      // Overall brightness — very slightly dimmer than pure white, warm & aged
      ctx.fillStyle = "rgba(0,18,25,0.045)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(238,155,0,0.02)"; // warm cast (aged, not clinical)
      ctx.fillRect(0, 0, w, h);

      // Phosphor bloom — faint green-warm tint, screen blend over the whole panel
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(0,255,65,0.03)";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Scanlines — 1px line every 3px
      ctx.fillStyle = "rgba(0,18,25,0.06)";
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
      // Pixel grid — 1px every 4px (barely-there LCD subpixel feel)
      ctx.fillStyle = "rgba(0,18,25,0.02)";
      for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 1, h);

      // Horizontal interference — extremely faint shimmer drifting down
      const bandY = ((t * 0.02) % (h + 200)) - 100;
      const band = ctx.createLinearGradient(0, bandY - 80, 0, bandY + 80);
      band.addColorStop(0, "rgba(255,255,255,0)");
      band.addColorStop(0.5, "rgba(255,255,255,0.02)");
      band.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, bandY - 80, w, 160);

      // Edge vignette — the dominant CRT cue. Elliptical (wider than tall):
      // transparent at the centre → rgba(0,18,25,0.3) at the four corners, which
      // must read as clearly darker than the middle. Drawn in a horizontally
      // stretched space so the falloff is wider than it is tall.
      ctx.save();
      const VX = 1.35; // horizontal stretch ⇒ ellipse wider than tall
      ctx.translate(w / 2, h / 2);
      ctx.scale(VX, 1);
      const vr = Math.hypot(w / 2 / VX, h / 2); // reaches the corners exactly
      const vg = ctx.createRadialGradient(0, 0, vr * 0.32, 0, 0, vr);
      vg.addColorStop(0, "rgba(0,18,25,0)");
      vg.addColorStop(0.62, "rgba(0,18,25,0.06)");
      vg.addColorStop(1, "rgba(0,18,25,0.3)");
      ctx.fillStyle = vg;
      ctx.fillRect(-w, -h, w * 2, h * 2);
      ctx.restore();

      // Inner edge darkening — equivalent to two stacked inset box-shadows on
      // the content container. The tight 80px/0.2 ring gives crisp edge depth;
      // the broad 120px/0.15 ring makes the whole screen feel recessed and
      // gently curved (centre brighter than edges), like a real CRT tube — no
      // transform or tilt involved.
      const insetShadow = (spreadPx: number, alpha: number) => {
        const e = Math.max(spreadPx * 0.5, Math.min(w, h) * (spreadPx / 720));
        const mk = (x0: number, y0: number, x1: number, y1: number) => {
          const g = ctx.createLinearGradient(x0, y0, x1, y1);
          g.addColorStop(0, `rgba(0,18,25,${alpha})`);
          g.addColorStop(1, "rgba(0,18,25,0)");
          return g;
        };
        ctx.fillStyle = mk(0, 0, 0, e);
        ctx.fillRect(0, 0, w, e);
        ctx.fillStyle = mk(0, h, 0, h - e);
        ctx.fillRect(0, h - e, w, e);
        ctx.fillStyle = mk(0, 0, e, 0);
        ctx.fillRect(0, 0, e, h);
        ctx.fillStyle = mk(w, 0, w - e, 0);
        ctx.fillRect(w - e, 0, e, h);
      };
      insetShadow(120, 0.15); // broad — recessed, curved-tube depth
      insetShadow(80, 0.2); // tight — crisp edge darkening

      ctx.restore();
    }

    // Paint the whole portfolio document directly onto the screen-texture canvas
    // each frame, through the same UV-island orientation the intro uses, so the
    // content is physically part of the curved CRT mesh. The bezel is the actual
    // 3D model geometry around it. CRT post-effects are applied on top, in the
    // same logical space, before the texture is flagged for upload.
    function drawContentScreen(heroElapsed: number, dt: number, t: number) {
      const cw = logicalW; // content area = the screen island (logical px)
      const ch = logicalH;

      // base fill — cream across the whole canvas (only the island is sampled)
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.fillStyle = CREAM;
      sctx.fillRect(0, 0, TEX_W, TEX_H);

      // hero typewriter — cinematic schedule (slow, with a breath after "hi")
      let heroChars = 0;
      while (heroChars < HERO_TIMES.length && heroElapsed >= HERO_TIMES[heroChars]) heroChars++;
      const typing = heroChars < HERO_TITLE.length;
      const heroCaret = scrollY < ch * 0.4 && (typing || heroElapsed % 1060 < 530);
      if (heroChars > lastHeroChars) {
        for (let i = lastHeroChars; i < heroChars; i++) audio.modernKey();
        lastHeroChars = heroChars;
      }

      const now = new Date();
      const clock = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      const env: PaintEnv = {
        W: cw,
        H: ch,
        fonts,
        heroChars,
        heroCaret,
        age,
        hoverHref,
        menuHover,
        clock,
      };

      // measure → clamp scroll, then advance each section's in-view age
      const layout = layoutDocument(sctx, env);
      maxScroll = Math.max(0, layout.total - ch);
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
      const k = 1 - Math.exp(-dt / SCROLL_EASE);
      scrollY += (targetScroll - scrollY) * k;
      if (Math.abs(targetScroll - scrollY) < 0.25) scrollY = targetScroll;

      for (const box of layout.boxes) {
        sectionTops[box.id] = box.top;
        if (box.id === "hero") continue;
        if (box.top - scrollY < ch * REVEAL_TRIGGER) {
          age[box.id] = (age[box.id] ?? 0) + dt;
        }
      }

      // Draw through the UV-island orientation so logical (0,0)=screen top-left
      // lands exactly on the visible glass — the identical mechanism as the
      // intro's withOrientation().
      withOrientation(() => {
        sctx.save();
        sctx.beginPath();
        sctx.rect(0, 0, cw, ch);
        sctx.clip();
        sctx.save();
        sctx.translate(0, -scrollY);
        contentLinks = drawDocument(sctx, env, layout);
        sctx.restore();
        // Finder menu bar — fixed at the top, above the scrolled content
        menuRects = drawMenuBar(sctx, env);
        // CRT post-processing, in logical space, on top of the content
        contentCrt(sctx, cw, ch, t);
        sctx.restore();
      });

      screenTexture.needsUpdate = true;
    }

    function recomputeCameraTargets() {
      if (!model) return;
      // FIX 1 — frame the entire model (computer + keyboard + mouse) straight
      // back on the Z axis, aimed at the bounding-box centre, padded all round.
      modelBox.setFromObject(model);
      const mSize = modelBox.getSize(new THREE.Vector3());
      modelBox.getCenter(modelCenter);
      const startDist = fitDistance(mSize.x, mSize.y, 1.3);
      startCamPos.set(
        modelCenter.x,
        modelCenter.y,
        modelBox.max.z + startDist, // clear the frontmost geometry (keyboard/mouse)
      );

      // Final framing — the screen face fills the viewport edge to edge (pad
      // 1.0 ⇒ the limiting axis touches the edges, only a hair of bezel). The
      // mesh's own curvature wraps the content at the very edges; nothing else.
      const finalDist = fitDistance(screenW, screenH, 1.0);
      finalCamPos.copy(screenCenter).addScaledVector(screenNormal, finalDist);
      // World-up, rolled a hair about the view axis so the whole render sits
      // level — counter-clockwise, correcting the slight tilt of everything.
      camera.up.set(0, 1, 0).applyAxisAngle(screenNormal, VIEW_ROLL);
    }

    // ── Load the model ──
    const loader = new GLTFLoader();
    loader.load("/mac.glb", (gltf) => {
      if (disposed) return;
      model = gltf.scene;
      scene.add(model);
      model.updateWorldMatrix(true, true);

      let screenMesh: THREE.Mesh | null = null;
      model.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (child.name === "Computer_Screen_0") screenMesh = mesh;
        if (child.name.endsWith("_Keys_0")) {
          keyStates.set(child.name, {
            mesh: child,
            baseY: child.position.y,
            offset: 0,
          });
        }
      });

      if (screenMesh) {
        const sm = screenMesh as THREE.Mesh;
        screenMeshObj = sm; // used for pointer→content raycasting
        // Project the screen texture onto the screen mesh (unlit, like a CRT).
        sm.material = new THREE.MeshBasicMaterial({
          map: screenTexture,
          toneMapped: false,
        });

        // Resolve the screen's world centre, normal, in-plane size + axes from
        // its local geometry — robust to whatever rotation the GLB ships with.
        const geom = sm.geometry;
        geom.computeBoundingBox();
        const lb = geom.boundingBox!;
        const lsize = lb.getSize(new THREE.Vector3());
        const lcenter = lb.getCenter(new THREE.Vector3());

        const wq = new THREE.Quaternion();
        const wpos = new THREE.Vector3();
        const wscale = new THREE.Vector3();
        sm.matrixWorld.decompose(wpos, wq, wscale);

        const worldSize = {
          x: lsize.x * Math.abs(wscale.x),
          y: lsize.y * Math.abs(wscale.y),
          z: lsize.z * Math.abs(wscale.z),
        };
        const axes = ["x", "y", "z"] as const;
        let normalAxis: "x" | "y" | "z" = "x";
        for (const a of axes) if (worldSize[a] < worldSize[normalAxis]) normalAxis = a;
        const unit = {
          x: new THREE.Vector3(1, 0, 0),
          y: new THREE.Vector3(0, 1, 0),
          z: new THREE.Vector3(0, 0, 1),
        };
        screenNormal.copy(unit[normalAxis]).applyQuaternion(wq).normalize();
        if (screenNormal.z < 0) screenNormal.negate(); // face is toward +Z

        const inPlane = axes.filter((a) => a !== normalAxis);
        const a0 = unit[inPlane[0]].clone().applyQuaternion(wq).normalize();
        const a1 = unit[inPlane[1]].clone().applyQuaternion(wq).normalize();
        const wUp = new THREE.Vector3(0, 1, 0);
        // whichever in-plane axis aligns more with world-up is the screen height
        if (Math.abs(a0.dot(wUp)) >= Math.abs(a1.dot(wUp))) {
          screenH = worldSize[inPlane[0]];
          screenW = worldSize[inPlane[1]];
          screenUpDir.copy(a0);
          screenRightDir.copy(a1);
        } else {
          screenH = worldSize[inPlane[1]];
          screenW = worldSize[inPlane[0]];
          screenUpDir.copy(a1);
          screenRightDir.copy(a0);
        }
        if (screenUpDir.y < 0) screenUpDir.negate();
        screenCenter.copy(lcenter).applyMatrix4(sm.matrixWorld);

        // FIX (typing not visible) — the screen's UVs occupy a *rotated
        // sub-rectangle* of the texture, so text drawn at the canvas top-left
        // fell outside the sampled region. Measure (a) the UV island bounds and
        // (b) how UV maps to the screen plane, then build a canvas transform so
        // logical (0,0)=screen top-left, x→right, y→down, landing on the glass.
        const uv = geom.attributes.uv;
        const pos = geom.attributes.position;
        if (uv && pos) {
          const n = pos.count;
          let su = 0, sv = 0, sr = 0, sup = 0;
          let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
          const rs: number[] = [];
          const ups: number[] = [];
          const us: number[] = [];
          const vs: number[] = [];
          const wp = new THREE.Vector3();
          for (let i = 0; i < n; i++) {
            wp.fromBufferAttribute(pos, i).applyMatrix4(sm.matrixWorld);
            const r = wp.clone().sub(screenCenter).dot(screenRightDir);
            const up = wp.clone().sub(screenCenter).dot(screenUpDir);
            const u = uv.getX(i);
            const v = uv.getY(i);
            us.push(u); vs.push(v); rs.push(r); ups.push(up);
            su += u; sv += v; sr += r; sup += up;
            umin = Math.min(umin, u); umax = Math.max(umax, u);
            vmin = Math.min(vmin, v); vmax = Math.max(vmax, v);
          }
          const mu = su / n, mv = sv / n, mr = sr / n, mup = sup / n;
          let Suu = 0, Suv = 0, Svv = 0, Sur = 0, Svr = 0, Sup = 0, Svp = 0;
          for (let i = 0; i < n; i++) {
            const du = us[i] - mu, dv = vs[i] - mv;
            const dr = rs[i] - mr, dp = ups[i] - mup;
            Suu += du * du; Suv += du * dv; Svv += dv * dv;
            Sur += du * dr; Svr += dv * dr; Sup += du * dp; Svp += dv * dp;
          }
          const det = Suu * Svv - Suv * Suv;
          let quarter = 0;
          if (Math.abs(det) > 1e-9) {
            // first column of the (u,v)→(right,up) matrix = ∂(right,up)/∂u
            const A = (Svv * Sur - Suv * Svr) / det;
            const C = (Svv * Sup - Suv * Svp) / det;
            quarter = ((Math.round(Math.atan2(C, A) / (Math.PI / 2)) % 4) + 4) % 4;
          }

          // UV island → canvas pixels (CanvasTexture is flipY, so v is mirrored)
          const ix0 = umin * TEX_W;
          const iy0 = (1 - vmax) * TEX_H;
          const iw = (umax - umin) * TEX_W;
          const ih = (vmax - vmin) * TEX_H;

          // setTransform that fits logical space into the island with rotation
          if (quarter === 1) {
            texMatrix = [0, 1, -1, 0, ix0 + iw, iy0];
            logicalW = ih; logicalH = iw;
          } else if (quarter === 2) {
            texMatrix = [-1, 0, 0, -1, ix0 + iw, iy0 + ih];
            logicalW = iw; logicalH = ih;
          } else if (quarter === 3) {
            texMatrix = [0, -1, 1, 0, ix0, iy0 + ih];
            logicalW = ih; logicalH = iw;
          } else {
            texMatrix = [1, 0, 0, 1, ix0, iy0];
            logicalW = iw; logicalH = ih;
          }
        }
      } else {
        modelBox.setFromObject(model);
        modelBox.getCenter(screenCenter);
      }

      recomputeCameraTargets();

      // ── Place the studio lights + screen glow relative to the model ──
      const mSize = modelBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(mSize.x, mSize.y, mSize.z) || 1;
      keyLight.position.set(
        modelCenter.x + maxDim * 0.9,
        modelCenter.y + maxDim * 1.1,
        modelCenter.z + maxDim * 1.3,
      ); // warm key: above + right + front
      fillLight.position.set(
        modelCenter.x - maxDim * 1.2,
        modelCenter.y + maxDim * 0.4,
        modelCenter.z + maxDim * 0.9,
      ); // cool fill: opposite side
      fillLight.target.position.copy(modelCenter);
      rimLight.position
        .copy(modelCenter)
        .addScaledVector(screenNormal, -maxDim * 1.7); // directly behind
      rimLight.position.y += maxDim * 0.3;
      rimLight.target.position.copy(modelCenter);

      glow.position.copy(screenCenter).addScaledVector(screenNormal, screenH * 2);
      glow.target.position.copy(screenCenter);

      // ── Seed the ambient dust cloud in the dark space around the Mac ──
      dustExtent.set(maxDim * 1.3, maxDim * 1.1, maxDim * 0.9);
      for (let i = 0; i < DUST; i++) {
        dustPos[i * 3] = modelCenter.x + (Math.random() * 2 - 1) * dustExtent.x;
        dustPos[i * 3 + 1] = modelCenter.y + (Math.random() * 2 - 1) * dustExtent.y;
        dustPos[i * 3 + 2] = modelCenter.z + (Math.random() * 2 - 1) * dustExtent.z;
        dustVel[i * 3] = (Math.random() * 2 - 1) * maxDim * 0.00002; // slight x drift
        dustVel[i * 3 + 1] = (0.3 + Math.random() * 0.7) * maxDim * 0.00012; // slow up
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      dustMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      });
      dust = new THREE.Points(dustGeo, dustMat);
      dust.renderOrder = -1;
      scene.add(dust);

      console.log(
        "[MacExperience] screen mesh:",
        screenMesh ? "Computer_Screen_0" : "NOT FOUND",
      );
      console.log("[MacExperience] animatable key meshes:", keyStates.size);
    });

    // ── Keyboard (FIX 6) ──
    const onKeyDown = (e: KeyboardEvent) => {
      const name = codeToMesh(e.code);
      if (name && keyStates.has(name)) pressed.add(name);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const name = codeToMesh(e.code);
      if (name) pressed.delete(name);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ── Scrolling + link interaction (active once content takes over) ──
    let contentActive = false;
    const onWheel = (e: WheelEvent) => {
      if (!contentActive) return;
      e.preventDefault();
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY));
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!contentActive) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = touchY - y;
      touchY = y;
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + dy * 1.4));
    };
    const onKeyScroll = (e: KeyboardEvent) => {
      if (!contentActive) return;
      const page = logicalH * 0.8;
      if (e.code === "ArrowDown") targetScroll = Math.min(maxScroll, targetScroll + 80);
      else if (e.code === "ArrowUp") targetScroll = Math.max(0, targetScroll - 80);
      else if (e.code === "PageDown" || e.code === "Space")
        targetScroll = Math.min(maxScroll, targetScroll + page);
      else if (e.code === "PageUp")
        targetScroll = Math.max(0, targetScroll - page);
      else if (e.code === "Home") targetScroll = 0;
      else if (e.code === "End") targetScroll = maxScroll;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!contentActive) {
        hoverHref = null;
        menuHover = null;
        return;
      }
      const menu = findMenu(e.clientX, e.clientY);
      menuHover = menu ? menu.id : null;
      const link = menu ? null : findLink(e.clientX, e.clientY);
      hoverHref = link ? link.href : null;
      renderer.domElement.style.cursor = menu || link ? "pointer" : "default";
    };
    const onClick = (e: MouseEvent) => {
      if (!contentActive) return;
      const menu = findMenu(e.clientX, e.clientY);
      if (menu) {
        // smooth-scroll the screen to that section (just below the menu bar)
        const top = sectionTops[menu.id];
        if (top !== undefined) {
          const barBottom = menuBarTop(logicalW) + menuBarH(logicalW);
          targetScroll = Math.max(0, Math.min(maxScroll, top - barBottom - 12 * (logicalW / 1000)));
        }
        return;
      }
      const link = findLink(e.clientX, e.clientY);
      if (link) window.open(link.href, link.href.startsWith("mailto:") ? "_self" : "_blank");
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyScroll);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("click", onClick);

    // ── Resize ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      recomputeCameraTargets();
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ──
    let raf = 0;
    let startTime = 0;
    let prev = 0;
    let zoomCaptured = false;
    let rotAtZoomStart = 0;
    let rotTargetFront = 0;
    // audio event latches
    let humStarted = false;
    let humFaded = false;
    let chimed = false;
    let lastTypePhase = "";
    let lastTypeCount = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!startTime) {
        startTime = now;
        prev = now;
      }
      const elapsed = now - startTime;
      const dt = Math.min(now - prev, 64); // clamp long frames (tab switches)
      prev = now;

      // — Screen texture / content —
      if (elapsed < BG_FADE_END) {
        drawScreen(elapsed); // the intro warm-up / "who am i" sequence (on mesh)
      } else {
        // Phase 3 onward: the portfolio is painted onto the same screen mesh
        // texture, so it wraps with the glass exactly like the intro did.
        contentActive = true;
        drawContentScreen(elapsed - SITE_REVEAL, dt, elapsed);
      }

      // — Camera / model —
      if (model) {
        if (elapsed < ZOOM_START) {
          // Stage 1: hold the wide shot — with imperceptible idle "breathing"
          // (1.0 → 1.003 over a 3s cycle), felt as weight, not seen as scale.
          const s = 1 + 0.0015 * (0.5 - 0.5 * Math.cos((2 * Math.PI * elapsed) / 3000));
          model.scale.setScalar(s);
          camera.position.copy(startCamPos);
          camera.lookAt(modelCenter);
        } else if (elapsed < ZOOM_END) {
          // Stage 2: film-style push-in from the wide shot to the screen.
          if (!zoomCaptured) {
            rotAtZoomStart = model.rotation.y;
            rotTargetFront =
              Math.round(rotAtZoomStart / (Math.PI * 2)) * Math.PI * 2;
            model.scale.setScalar(1); // breathing stops the moment zoom begins
            zoomCaptured = true;
          }
          const e = easeInOut((elapsed - ZOOM_START) / ZOOM_DUR);
          model.rotation.y = THREE.MathUtils.lerp(rotAtZoomStart, rotTargetFront, e);
          camera.position.lerpVectors(startCamPos, finalCamPos, e);
          lookTarget.lerpVectors(modelCenter, screenCenter, e);
          camera.lookAt(lookTarget);
        } else {
          // Locked at the final framing — the persistent bezel.
          model.rotation.y = rotTargetFront;
          camera.position.copy(finalCamPos);
          camera.lookAt(screenCenter);
        }

        // — Key depression (linear travel, ±KEY_DEPTH over 60ms) —
        for (const [name, st] of keyStates) {
          const target = pressed.has(name) ? -KEY_DEPTH : 0;
          if (st.offset !== target) {
            const dirSign = Math.sign(target - st.offset);
            st.offset += dirSign * KEY_RATE * dt;
            st.offset =
              dirSign < 0
                ? Math.max(st.offset, target)
                : Math.min(st.offset, target);
            st.mesh.position.y = st.baseY + st.offset;
          }
        }
      }

      // — Ambient dust (wide shot), fading out as the zoom begins —
      if (dust && dustMat && dust.visible) {
        if (elapsed < ZOOM_START) {
          for (let i = 0; i < DUST; i++) {
            dustPos[i * 3] += dustVel[i * 3] * dt;
            dustPos[i * 3 + 1] += dustVel[i * 3 + 1] * dt;
            // wrap from top back to the bottom of the volume
            if (dustPos[i * 3 + 1] > modelCenter.y + dustExtent.y) {
              dustPos[i * 3 + 1] = modelCenter.y - dustExtent.y;
              dustPos[i * 3] =
                modelCenter.x + (Math.random() * 2 - 1) * dustExtent.x;
            }
          }
          (dust.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
            true;
          dustMat.opacity = 0.08;
        } else if (elapsed < ZOOM_START + 400) {
          dustMat.opacity = 0.08 * (1 - (elapsed - ZOOM_START) / 400);
        } else {
          dust.visible = false;
        }
      }

      // — Screen glow: green during the terminal, cream after the flash; very
      //   subtle pulse, capped at 0.2 —
      const glowT =
        elapsed < SILENCE_END
          ? 0
          : Math.min(1, (elapsed - SILENCE_END) / 400);
      glow.color.copy(GLOW_GREEN).lerp(GLOW_CREAM, glowT);
      glow.intensity = 0.2 * (0.85 + 0.15 * Math.sin(elapsed / 700));

      // ── Audio events (silent until the AudioContext is unlocked) ──
      // CRT hum across the terminal phase, faded out at the cream flash.
      if (!humStarted && elapsed >= SETTLE && elapsed < SILENCE_END) {
        audio.startHum();
        humStarted = true;
      }
      if (!humFaded && elapsed >= SILENCE_END) {
        audio.fadeOutHum(500);
        humFaded = true;
      }
      // single clean chime the instant the screen flips black → cream
      if (!chimed && elapsed >= SILENCE_END) {
        audio.chime();
        chimed = true;
      }
      // terminal keypress clicks (one per newly revealed character)
      let typePhase = "";
      let typeCount = 0;
      if (elapsed >= SEQ_START && elapsed < A1_TYPE_END) {
        typePhase = "a1";
        typeCount = Math.min(CONFUSE_LEN, Math.floor((elapsed - SEQ_START) / 150));
      } else if (elapsed >= A2_TYPE_START && elapsed < A2_TYPE_END) {
        typePhase = "a2";
        typeCount = Math.min(CONFUSE_LEN, Math.floor((elapsed - A2_TYPE_START) / 80));
      } else if (elapsed >= A3_TYPE_START && elapsed < A3_TYPE_END) {
        typePhase = "a3";
        typeCount = 1;
      }
      if (typePhase !== lastTypePhase) {
        lastTypePhase = typePhase;
        lastTypeCount = 0;
      }
      if (typeCount > lastTypeCount) {
        for (let i = lastTypeCount; i < typeCount; i++) audio.click();
        lastTypeCount = typeCount;
      }
      // (soft modern keystrokes for the hero are played inside drawContentScreen,
      //  one per newly revealed glyph.)

      // FIX 1 — keep the HTML container locked to the screen face every frame
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    // ── Cleanup (only on real unmount; the scene is otherwise permanent) ──
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      audio.dispose();
      screenTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // The entire experience — bezel, screen, and the portfolio document on the
  // glass — is rendered on this single canvas. Nothing else is in the DOM.
  return (
    <div
      ref={mountRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, background: "#000" }}
    />
  );
}
