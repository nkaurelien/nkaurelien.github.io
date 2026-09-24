'use client';

import { useEffect } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

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
            fill: ['#f30a07', '#cc0806', '#a90504', '#850302', '#6b7280'],
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
          stroke: '#f30a07',
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
      // Effet décoratif au clic : désactivé si l'utilisateur réduit les animations.
      if (!burst || !bubble || prefersReducedMotion()) return;

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
