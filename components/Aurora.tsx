"use client";

import { useEffect, useRef } from "react";

interface AuroraProps {
  colorStops: string[];
  amplitude?: number;
  blend?: number;
}

export default function Aurora({
  colorStops,
  amplitude = 1,
  blend = 0.5,
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let animationFrame = 0;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);

      colorStops.forEach((stop, index) => {
        const position =
          colorStops.length <= 1
            ? 0
            : index / (colorStops.length - 1);

        gradient.addColorStop(position, stop);
      });

      ctx.globalAlpha = Math.max(0, Math.min(1, blend));
      ctx.fillStyle = gradient;

      const wave = Math.max(0, amplitude) * 18;

      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 8) {
        const normalized = width === 0 ? 0 : x / width;

        const y =
          height * 0.5 +
          Math.sin(normalized * Math.PI * 3 + time) * wave +
          Math.sin(normalized * Math.PI * 7 - time * 0.7) * wave * 0.35;

        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 1;

      time += 0.008;

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [colorStops, amplitude, blend]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
}
