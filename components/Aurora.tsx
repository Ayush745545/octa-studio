import React, { useMount } from 'react';

interface AuroraProps {
  colorStops: string[];
  amplitude?: number;
  blend?: number;
}

export default function Aurora({ colorStops, amplitude = 1, blend = 0.5 }) {
  useMount(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    colorStops.forEach(stop => {
      const [, color] = stop.split('#');
      gradient.addColorStop(0.5, color); // Pulsing effect
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animation loop
    const animate = () => {
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      requestAnimationFrame(animate);
    };
    animate();
  });

  return <canvas style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;"></canvas>;
}