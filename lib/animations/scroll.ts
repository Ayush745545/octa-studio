import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap as gsapInstance } from "./gsap";

type ScrollTriggerOptions = Parameters<typeof ScrollTrigger.create>[0];

export function useGSAPScrollTrigger(
  callback: (self: ScrollTrigger) => void,
  options: ScrollTriggerOptions = {},
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsapInstance.context(() => {
      ScrollTrigger.create({
        ...options,
        trigger: ref.current,
        onEnter: callback,
      });
    }, ref);

    return () => ctx.revert();
  }, [callback, options]);

  return ref;
}

export function usePinnedSection(
  triggerRef: React.RefObject<HTMLDivElement | null>,
  onUpdate: (progress: number) => void,
  options: ScrollTriggerOptions = {},
) {
  useEffect(() => {
    if (!triggerRef.current) return;

    const ctx = gsapInstance.context(() => {
      ScrollTrigger.create({
        ...options,
        trigger: triggerRef.current,
        pin: false,
        onUpdate: (self) => onUpdate(self.progress),
      });
    }, triggerRef);

    return () => ctx.revert();
  }, [triggerRef, onUpdate, options]);
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
