"use client";

import type { CSSProperties } from "react";

export interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Animated aurora gradient backdrop. Pure CSS so it costs nothing on the
 * client and degrades to a static gradient when motion is reduced.
 */
export default function Aurora({
  colorStops = ["#5227FF", "#7CFF67", "#5227FF"],
  amplitude = 1,
  blend = 0.5,
  speed = 1,
  className = "",
  style,
}: AuroraProps) {
  const stops = colorStops.length > 0 ? colorStops : ["#5227FF", "#7CFF67", "#5227FF"];
  const duration = `${Math.max(4, 18 / Math.max(speed, 0.1))}s`;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={style}
    >
      <div
        className="aurora-layer absolute inset-x-[-25%] top-[-40%] h-[140%]"
        style={
          {
            backgroundImage: `linear-gradient(100deg, ${stops.join(", ")})`,
            filter: `blur(${60 * blend + 20}px)`,
            opacity: Math.min(1, 0.45 * amplitude + 0.2),
            animationDuration: duration,
          } as CSSProperties
        }
      />
      <style jsx>{`
        .aurora-layer {
          background-size: 200% 200%;
          animation-name: aurora-drift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes aurora-drift {
          0% {
            background-position: 0% 50%;
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            background-position: 100% 50%;
            transform: translate3d(0, -3%, 0) scale(1.08);
          }
          100% {
            background-position: 0% 50%;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-layer {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
