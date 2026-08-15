"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * DockText — eldoraui-style dock animation applied to text.
 * Characters are ALWAYS fully visible at their normal size and spacing.
 * Only when the cursor is near a character does it gently grow and gain
 * extra spacing (hover reaction). It settles back to normal instantly after.
 */
export default function DockText({
  text,
  className,
  spread = 2.5,
}: {
  text: string;
  className?: string;
  spread?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(Infinity);

  // springs per character: 0 = normal, >0 = reacted
  const springs = Array.from({ length: text.length }, () =>
    useSpring(0, { stiffness: 300, damping: 25 })
  );

  function updateForPosition(x: number) {
    mouseX.set(x);
    const container = containerRef.current;
    if (!container) return;
    const spans = Array.from(container.querySelectorAll("span[data-ch]"));
    spans.forEach((span, i) => {
      const rect = span.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(x - center);
      const maxDist = 160;
      springs[i].set(Math.max(0, 1 - dist / maxDist) * 0.35);
    });
  }

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={(e) => updateForPosition(e.pageX)}
      onMouseLeave={() => {
        mouseX.set(Infinity);
        springs.forEach((s) => s.set(0));
      }}
      className={`relative inline-block ${className ?? ""}`}
    >
      <span className="inline-block">
        {text.split("").map((char, i) => {
          // base scale = 1; adds up to +35% growth only near the cursor
          const scale = useTransform(springs[i], (v) => 1 + v * 0.35);
          const margin = useTransform(springs[i], (v) => `${v * spread}px`);
          return (
            <motion.span
              key={i}
              data-ch
              className="inline-block"
              style={{ scale, marginRight: margin }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          );
        })}
      </span>
    </motion.div>
  );
}
