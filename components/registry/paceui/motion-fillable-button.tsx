"use client";

import { motion } from "motion/react";

/**
 * MotionFillableButton — paceui-style fillable button.
 * A rounded pill where a white fill slides in from the left on hover,
 * and the arrow nudges to the right — giving a confident "fill" feel.
 *
 * Usage:
 *   <MotionFillableButton href="/calendar">Open Calendar <span>→</span></MotionFillableButton>
 */
export default function MotionFillableButton({
  children,
  href,
  className = "",
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <motion.a
      href={href}
      className={`group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full border border-zinc-800 px-7 text-[14px] font-semibold text-white ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* sliding white fill */}
      <motion.span
        className="absolute inset-0 z-0 bg-white"
        initial={{ x: "-101%" }}
        whileHover={{ x: "0%" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
      {/* button label */}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </motion.a>
  );
}
