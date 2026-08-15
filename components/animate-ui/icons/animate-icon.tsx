"use client";

import React from "react";

interface AnimateIconProps {
  children: React.ReactNode;
  className?: string;
  animateOnHover?: boolean;
}

/**
 * AnimateIcon — shadcn/animate-ui style animated icon wrapper.
 * Applies a gentle wiggle + scale animation on hover when animateOnHover is true.
 */
export function AnimateIcon({
  children,
  className,
  animateOnHover = false,
}: AnimateIconProps) {
  return (
    <span
      data-slot="animate-icon"
      className={`inline-flex items-center justify-center transition-transform duration-200 ${
        animateOnHover
          ? "group-hover:animate-icon-wiggle group-hover:scale-110"
          : ""
      } ${className ?? ""}`}
      style={{ transformOrigin: "center" }}
    >
      {children}
    </span>
  );
}

export default AnimateIcon;
