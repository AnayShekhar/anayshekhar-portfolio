"use client";

import {
  useAnimationFrame,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useEffect, useId, useRef } from "react";

/*
  InkField — the hero's single computational material.

  Not a sphere, blob, crystal, planet, or sculpture. An irregular, never-
  symmetrical mass of suspended density — ink trapped in water, information
  slowly organizing itself.

  Behavior (CLAUDE.md §"object behavior"):
    scroll velocity → energy → turbulence → settles.
  Scroll is NEVER wired to scale, rotation, squash or position. It only feeds
  turbulence energy, which a low-tension spring lets settle over ~1.5s after
  scrolling stops. When still, the material is still.
*/

interface InkFieldProps {
  size?: number;
}

// Irregular control points [angleRadians, radiusFactor]. Deliberately uneven
// angles and radii so the silhouette can never read as a circle.
const CONTROL: [number, number][] = [
  [0.0, 1.04],
  [0.74, 0.82],
  [1.46, 1.1],
  [2.18, 0.78],
  [2.92, 1.0],
  [3.58, 0.72],
  [4.28, 1.06],
  [4.84, 0.86],
  [5.5, 0.96],
];

// Catmull-Rom → cubic Bézier, closed. Smooth organic membrane.
function smoothClosedPath(pts: [number, number][]) {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }
  return d + "Z";
}

function buildPath(cx: number, cy: number, r: number, squashX = 1, squashY = 1) {
  const pts = CONTROL.map(([a, rf]) => [
    cx + Math.cos(a) * r * rf * squashX,
    cy + Math.sin(a) * r * rf * squashY,
  ]) as [number, number][];
  return smoothClosedPath(pts);
}

// Displacement scale: a slow resting churn (breathing) that energizes with
// scroll. The mass is always quietly alive; scrolling lends it real energy.
const BASE_SCALE = 9;
const BREATH_AMP = 5; // slow autonomous churn amplitude
const ENERGY_RANGE = 62;

export default function InkField({ size = 560 }: InkFieldProps) {
  const uid = useId().replace(/:/g, "");
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const reducedRef = useRef(false);

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // normalize |velocity| → 0..1 energy
  const rawEnergy = useTransform(scrollVelocity, (v) =>
    Math.min(1, Math.abs(v) / 2200),
  );
  // low tension + heavy mass → the material keeps settling for ~1.5s after
  // scrolling stops, so it feels heavy and never attached to the page.
  const energy = useSpring(rawEnergy, {
    stiffness: 24,
    damping: 16,
    mass: 1.4,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedRef.current = !!window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reducedRef.current && dispRef.current) {
        dispRef.current.setAttribute("scale", String(BASE_SCALE));
      }
    }
  }, []);

  // Continuous, autonomous life — a slow breathing churn plus a gentle drift &
  // sway of the whole mass, so it reads as suspended density rather than a
  // static asset. Scroll energy rides on top of this resting motion.
  useAnimationFrame((t) => {
    if (reducedRef.current) return;
    const s = t / 1000;
    const e = energy.get();

    if (dispRef.current) {
      const breath = BREATH_AMP * (Math.sin(s * 0.32) * 0.6 + Math.sin(s * 0.11) * 0.4);
      dispRef.current.setAttribute(
        "scale",
        (BASE_SCALE + breath + e * ENERGY_RANGE).toFixed(2),
      );
    }

    if (groupRef.current) {
      // slow, irregular drift — never attached to the page
      const dx = Math.sin(s * 0.13) * 14 + Math.sin(s * 0.061) * 9;
      const dy = Math.cos(s * 0.097) * 12 + Math.sin(s * 0.043) * 7;
      const rot = Math.sin(s * 0.05) * 2.2;
      groupRef.current.setAttribute(
        "transform",
        `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)} ${size / 2} ${size / 2})`,
      );
    }
  });

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.3;

  const filterId = `ink-f-${uid}`;
  const turbId = `ink-t-${uid}`;
  const coreGrad = `ink-core-${uid}`;
  const haloGrad = `ink-halo-${uid}`;

  // two offset density bodies → suspended depth, never one clean shape
  const bodyA = buildPath(cx, cy, r, 1.06, 0.9);
  const bodyB = buildPath(cx + size * 0.03, cy + size * 0.02, r * 0.78, 0.92, 1.08);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
      aria-hidden
    >
      <defs>
        {/* off-center gradient: dense teal core diffusing into the canvas */}
        <radialGradient id={coreGrad} cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#0a9396" stopOpacity="0.9" />
          <stop offset="46%" stopColor="#0a7d80" stopOpacity="0.78" />
          <stop offset="78%" stopColor="#005f73" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#005f73" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={haloGrad} cx="58%" cy="64%" r="70%">
          <stop offset="0%" stopColor="#005f73" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#005f73" stopOpacity="0" />
        </radialGradient>

        <filter
          id={filterId}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          {/* low frequency = large soft lobes, like ink diffusing in water */}
          <feTurbulence
            id={turbId}
            type="fractalNoise"
            baseFrequency="0.006 0.008"
            numOctaves="3"
            seed="11"
            stitchTiles="stitch"
            result="turb"
          >
            {/* slow internal currents — the ink keeps re-organizing itself */}
            <animate
              attributeName="baseFrequency"
              values="0.006 0.008;0.0085 0.0055;0.005 0.009;0.006 0.008"
              dur="22s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="seed"
              values="11;14;9;11"
              dur="34s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="turb"
            scale={BASE_SCALE}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          {/* diffusion — soft, watery edges with no specular/chrome look */}
          <feGaussianBlur in="displaced" stdDeviation="6" />
        </filter>
      </defs>

      <g ref={groupRef} filter={`url(#${filterId})`}>
        <path d={bodyA} fill={`url(#${haloGrad})`} opacity="0.85" />
        <path d={bodyB} fill={`url(#${coreGrad})`} />
      </g>
    </svg>
  );
}
