"use client";

import { useAnimationFrame } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

export interface BlobAnchor {
  x: number;
  y: number;
  radius: number;
  strength: number;
}

interface GridDistortionProps {
  introDone: boolean;
  anchorRef: React.RefObject<BlobAnchor>;
}

const GRID = 64;
const GRID_STROKE = "rgba(0, 95, 115, 0.045)";

export function GridDistortion({ introDone, anchorRef }: GridDistortionProps) {
  const uid = useId().replace(/:/g, "");
  const lensCircleRef = useRef<SVGCircleElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const rootRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const opacityRef = useRef(0);

  useEffect(() => {
    const measure = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, []);

  useAnimationFrame((_, delta) => {
    if (!size.w || !size.h) return;

    const dt = Math.min(delta / 1000, 0.032);
    const targetOpacity = introDone ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * (1 - Math.exp(-dt / 0.9));
    if (rootRef.current) {
      rootRef.current.style.opacity = String(opacityRef.current);
    }

    const anchor = anchorRef.current;
    if (!anchor || anchor.strength < 0.01) return;

    if (lensCircleRef.current) {
      lensCircleRef.current.setAttribute("cx", anchor.x.toFixed(1));
      lensCircleRef.current.setAttribute("cy", anchor.y.toFixed(1));
      lensCircleRef.current.setAttribute("r", anchor.radius.toFixed(1));
    }

    if (dispRef.current) {
      dispRef.current.setAttribute(
        "scale",
        (10 + anchor.strength * 14).toFixed(1),
      );
    }
  });

  if (!size.w || !size.h) return null;

  const filterId = `grid-warp-${uid}`;
  const patternId = `grid-pat-${uid}`;
  const mapId = `grid-map-${uid}`;
  const lensGradId = `grid-lens-${uid}`;

  return (
    <svg
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-0"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      aria-hidden
      style={{ opacity: 0 }}
    >
      <defs>
        <pattern
          id={patternId}
          width={GRID}
          height={GRID}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${GRID} 0 L 0 0 0 ${GRID}`}
            fill="none"
            stroke={GRID_STROKE}
            strokeWidth="1"
          />
        </pattern>

        <radialGradient id={lensGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9494D2" />
          <stop offset="55%" stopColor="#8484A8" />
          <stop offset="100%" stopColor="#808080" />
        </radialGradient>

        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={size.w}
          height={size.h}
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={`#${mapId}`}
            width={size.w}
            height={size.h}
            preserveAspectRatio="none"
            result="lensMap"
          />
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="lensMap"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      {/* displacement map — neutral field with a soft lens bulge at the blob anchor */}
      <g id={mapId} visibility="hidden" aria-hidden>
        <rect width={size.w} height={size.h} fill="#808080" />
        <circle
          ref={lensCircleRef}
          cx={size.w * 0.6}
          cy={size.h * 0.5}
          r={160}
          fill={`url(#${lensGradId})`}
        />
      </g>

      <rect
        width={size.w}
        height={size.h}
        fill={`url(#${patternId})`}
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}
