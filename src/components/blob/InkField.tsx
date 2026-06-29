"use client";

import { useEffect, useRef } from "react";
import type { BlobAnchor } from "@/components/blob/GridDistortion";

/*
  InkField — the hero object. A living organic shape rendered as a metaball
  field of six particles on a 2D canvas, anchored to the right side of the hero
  and vertically balanced against the headline.

  At rest it is calm and approachable: soft, rounded-but-asymmetric, warm amber
  at low opacity, breathing slowly. Edges fade to nothing — no outline, glow, or
  shadow.

  Two triggers wake it — the pointer entering its region, or a scroll starting.
  When triggered it sharpens: edges define, particles accelerate (~3x) and pull
  together, it grows asymmetric lobes, and its colour transitions amber → deep
  teal over ~600ms. The fierce state holds ~1.75s, then it settles back to amber
  over ~800ms, softening and slowing. It trusts you again.

  The shape never becomes circular, never becomes symmetric, never loops.

  It stays anchored to the hero's right and never translates with scroll — scroll
  only injects internal impulse that distorts the mass. Retina-sharp via dpr.
*/

interface InkFieldProps {
  introDone?: boolean;
  onAnchorUpdate?: (anchor: BlobAnchor) => void;
}

// ── colour ──
const AMBER: [number, number, number] = [238, 155, 0]; // #EE9B00 — calm
const TEAL: [number, number, number] = [0, 95, 115]; //  #005F73 — fierce

// ── intensity dynamics ──
const HOLD = 1.75; // fierce state lasts ~1.75s after the last trigger
const TAU_RISE = 0.2; // ~600ms to reach teal (≈3τ)
const TAU_FALL = 0.27; // ~800ms back to amber
const ENTRANCE_TAU = 1.0;

const PARTICLES = 6;

// Asymmetric, non-circular base layout (unit offsets — never symmetric).
const BASE: [number, number][] = [
  [-0.04, -0.05],
  [-0.33, 0.12],
  [0.27, -0.2],
  [0.19, 0.29],
  [-0.24, 0.31],
  [0.1, 0.04],
];
const UNIT_R = [0.6, 0.42, 0.4, 0.45, 0.36, 0.5];

// Lobe directions — activated only when fierce. Asymmetric protrusions that
// make the shape briefly more complex than it was at rest.
const LOBE_X = [0.0, -0.55, 0.5, 0.18, -0.3, 0.12];
const LOBE_Y = [0.0, -0.2, -0.35, 0.5, 0.42, -0.1];

// Scroll-impulse directions (sum to ~zero → internal distortion, no translation).
const KX = [10, -16, 14, -12, 8, -4];
const KY = [-14, 9, -18, 16, -5, 12];

const SPRING_K = 6.0;
const SPRING_C = 2.4; // underdamped → natural overshoot + deceleration
const SCROLL_REF = 2400;

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// Two-octave async drift — independent slow paths per particle.
function driftX(i: number, t: number) {
  return (
    Math.sin(t * (0.21 + i * 0.05) + i * 1.3) * 0.7 +
    Math.sin(t * (0.13 + i * 0.03) + i * 0.7) * 0.3
  );
}
function driftY(i: number, t: number) {
  return (
    Math.cos(t * (0.19 + i * 0.04) + i * 1.1) * 0.7 +
    Math.sin(t * (0.11 + i * 0.05) + i * 2.0) * 0.3
  );
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function InkField({ onAnchorUpdate }: InkFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("[InkField] 2D context unavailable — hard-reload the page.");
      return;
    }

    const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // offscreen field buffer (recoloured each frame)
    const off = document.createElement("canvas");
    const octx = off.getContext("2d")!;

    let dpr = 1;
    let W = 0;
    let H = 0;
    let blobR = 0; // base radius of the mass
    let size = 0; // offscreen css size
    let blobX = 0; // right-of-hero anchor, viewport x

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // ~35–40% of hero width, capped by height so it never crowds the headline
      blobR = Math.min(W * 0.19, H * 0.26);
      size = Math.ceil(blobR * 3.4);
      off.width = Math.round(size * dpr);
      off.height = Math.round(size * dpr);
      blobX = W * 0.8; // anchored to the right side of the hero
    };
    layout();
    window.addEventListener("resize", layout);

    // particle + animated state
    const ps: P[] = BASE.map(([ox, oy]) => ({ x: ox, y: oy, vx: 0, vy: 0 }));
    const color: [number, number, number] = [...AMBER];
    let entrance = 0;
    let intensity = 0; // 0 = calm amber, 1 = fierce teal
    let lastTrigger = -Infinity;
    let pointerInside = false;

    let lastScrollY = window.scrollY;
    let lastT = performance.now();
    let raf = 0;
    let wasVisible = true; // track so we clear exactly once when it leaves view

    // ── triggers ──
    const trigger = (now: number) => {
      if (!reduced) lastTrigger = now;
    };

    // pointer entering the object's region wakes it
    const onPointerMove = (e: PointerEvent) => {
      const heroCenterY = H / 2 - window.scrollY;
      const dx = e.clientX - blobX;
      const dy = e.clientY - heroCenterY;
      const inside = dx * dx + dy * dy < (blobR * 1.9) ** 2;
      if (inside && !pointerInside) trigger(performance.now());
      pointerInside = inside;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // scroll starting wakes it (and injects impulse, handled in the loop)
    const onScroll = () => trigger(performance.now());
    window.addEventListener("scroll", onScroll, { passive: true });

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - lastT) / 1000, 0.05);
      lastT = now;
      const t = now / 1000;

      // entrance — fades in once on mount, then holds (never fades on scroll)
      entrance += (1 - entrance) * (1 - Math.exp(-dt / ENTRANCE_TAU));
      const ease = 1 - Math.pow(1 - entrance, 3);

      // intensity — rises toward 1 while a trigger is fresh, falls back after HOLD
      const target = now / 1000 - lastTrigger / 1000 < HOLD ? 1 : 0;
      const tau = target > intensity ? TAU_RISE : TAU_FALL;
      intensity += (target - intensity) * (1 - Math.exp(-dt / tau));
      const ie = smoothstep(0, 1, intensity); // eased intensity

      // colour: amber → teal with intensity
      for (let c = 0; c < 3; c++) color[c] = AMBER[c] + (TEAL[c] - AMBER[c]) * ie;

      // ── motion params (calm → fierce) ──
      const driftSpeed = reduced ? 0.25 : 0.5 + ie * 1.0; // ~3x when fierce
      const driftAmp = reduced ? 0.03 : 0.07 + ie * 0.05;
      const spread = 0.96 - ie * 0.36; // wide at rest, particles pull together
      const cohesion = 0.25 + ie * 1.3; // stronger inward pull when fierce
      const lobeAmp = ie * 0.34; // asymmetric lobes emerge only when fierce
      const impulse = reduced ? 0 : 0.5 + ie * 1.4;
      const damp = SPRING_C - ie * 0.5; // a touch less damped → more purposeful

      // breathing — slow, gentle, only really visible at rest
      const breath = Math.sin(t * 0.62) * 0.5 + Math.sin(t * 0.41 + 1.7) * 0.5;
      const breathScale = 1 + breath * 0.018 * (1 - ie);

      // ── scroll → internal impulse (mass distorts, never translates) ──
      const scrollY = window.scrollY;
      const scrollVel = dt > 0 ? (scrollY - lastScrollY) / dt : 0;
      lastScrollY = scrollY;
      const inj = reduced ? 0 : Math.max(-1.2, Math.min(1.2, scrollVel / SCROLL_REF));

      // the object stays anchored to the hero's right and scrolls away with it
      const blobY = H / 2 - scrollY;

      // ── integrate particles ──
      for (let i = 0; i < PARTICLES; i++) {
        const p = ps[i];
        let tx = BASE[i][0] * spread + driftX(i, t * driftSpeed) * driftAmp;
        let ty = BASE[i][1] * spread + driftY(i, t * driftSpeed) * driftAmp;
        // lobes wander slightly so they feel alive, not pinned
        tx += LOBE_X[i] * lobeAmp * (0.85 + 0.15 * Math.sin(t * 1.3 + i));
        ty += LOBE_Y[i] * lobeAmp * (0.85 + 0.15 * Math.cos(t * 1.1 + i));

        p.vx += inj * KX[i] * dt * impulse * 0.02;
        p.vy += inj * KY[i] * dt * impulse * 0.02;

        let ax = (tx - p.x) * SPRING_K - p.vx * damp;
        let ay = (ty - p.y) * SPRING_K - p.vy * damp;
        ax += -p.x * cohesion;
        ay += -p.y * cohesion;

        p.vx += ax * dt;
        p.vy += ay * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      // Skip the offscreen render + composite entirely when the mass has
      // scrolled fully out of view — the output would be blank anyway. Physics
      // above keep integrating so re-entry is seamless. Clear once on the way out.
      const visible = blobY + size / 2 > 0 && blobY - size / 2 < H;
      if (!visible) {
        if (wasVisible) {
          ctx.clearRect(0, 0, W, H);
          wasVisible = false;
        }
        if (onAnchorUpdate) {
          onAnchorUpdate({ x: blobX, y: blobY, radius: blobR, strength: 0 });
        }
        return;
      }
      wasVisible = true;

      // ── render the metaball field to the offscreen buffer ──
      // Overlapping soft radial gradients in one colour stack into a single
      // continuous mass — dense at the cores, fading to nothing at the edges.
      // No additive brightening, no hard cutoff.
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.globalCompositeOperation = "source-over";
      octx.clearRect(0, 0, size, size);
      const cxs = size / 2;
      const cys = size / 2;
      const r0 = (color[0] | 0).toString();
      const r1 = (color[1] | 0).toString();
      const r2 = (color[2] | 0).toString();
      const rgb = `${r0},${r1},${r2}`;

      // edge definition: soft at rest, sharper core when fierce
      const innerA = 0.5 + ie * 0.22;
      const midStop = 0.46 - ie * 0.12;
      const midA = 0.18 + ie * 0.08;

      for (let i = 0; i < PARTICLES; i++) {
        const px = cxs + ps[i].x * blobR * breathScale;
        const py = cys + ps[i].y * blobR * breathScale;
        const r = UNIT_R[i] * blobR * (1.05 - ie * 0.1);
        const g = octx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(${rgb},${innerA})`);
        g.addColorStop(midStop, `rgba(${rgb},${midA})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        octx.fillStyle = g;
        octx.fillRect(px - r, py - r, r * 2, r * 2);
      }

      // ── composite onto the screen ──
      // max 35% at rest so it never dominates the headline; a touch more
      // contrast when fierce, still capped.
      const opacity = Math.min(0.35, 0.3 + breath * 0.025 + ie * 0.05) * ease;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = opacity;
      ctx.drawImage(off, blobX - size / 2, blobY - size / 2, size, size);
      ctx.globalAlpha = 1;

      // feed the notebook-grid lens beneath the object (subtle; intensifies a
      // little when fierce). Strength stays modest so the grid stays quiet.
      if (onAnchorUpdate) {
        onAnchorUpdate({
          x: blobX,
          y: blobY,
          radius: blobR,
          strength: ease * (0.5 + ie * 0.5),
        });
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", layout);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [onAnchorUpdate]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}
