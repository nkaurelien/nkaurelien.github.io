'use client';

import { useEffect } from 'react';

export default function ClientEffects() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let burst;
    let bubble;

    // Dynamically import @mojs/core on the client side only
    import('@mojs/core')
      .then(mojsModule => {
        const mojs = mojsModule.default;

        // 1. Particle burst effect
        burst = new mojs.Burst({
          left: 0,
          top: 0,
          radius: { 0: 32 },
          count: 7,
          angle: { 0: 30 },
          children: {
            shape: 'circle',
            radius: 4,
            fill: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
            strokeWidth: 0,
            duration: 600,
            easing: 'cubic.out',
          },
        });

        // 2. Expanding outline circle bubble effect
        bubble = new mojs.Shape({
          left: 0,
          top: 0,
          shape: 'circle',
          fill: 'none',
          stroke: '#6366f1',
          strokeWidth: { 3: 0 },
          radius: { 0: 24 },
          opacity: { 1: 0 },
          duration: 400,
          easing: 'cubic.out',
        });
      })
      .catch(err => {
        console.error('Failed to load mojs:', err);
      });

    const handleGlobalClick = e => {
      if (!burst || !bubble) return;

      // Find closest interactive element
      const target = e.target.closest('button, a, .mantine-Button-root, .mantine-ActionIcon-root, .mantine-Chip-label, .nav-link');
      if (!target) return;

      const x = e.clientX;
      const y = e.clientY;

      burst.tune({ x, y }).replay();
      bubble.tune({ x, y }).replay();
    };

    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return null;
}
