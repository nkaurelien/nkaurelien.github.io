'use client';

import { useEffect, useRef } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import loadScript from '@/lib/loadScript';

/**
 * Helper to normalize hex string or number to integer for Vanta.js
 */
const parseColor = (color, defaultColor) => {
  if (color === undefined || color === null) return defaultColor;
  if (typeof color === 'number') return color;
  if (typeof color === 'string') {
    const clean = color.trim().replace('#', '').replace('0x', '');
    const parsed = parseInt(clean, 16);
    return isNaN(parsed) ? defaultColor : parsed;
  }
  return defaultColor;
};

/**
 * VantaWaveBackground Component
 * 3D Wave / Fog background animation using Three.js and Vanta.js with customizable colors.
 *
 * @param {Object} props
 * @param {'waves' | 'fog'} [props.effectType='waves'] - Type of Vanta effect.
 * @param {string | number} [props.color] - Main wave color for 'waves' effect (e.g. '#4f46e5' or 0x4f46e5).
 * @param {string | number} [props.highlightColor] - Highlight color for 'fog' effect.
 * @param {string | number} [props.midtoneColor] - Midtone color for 'fog' effect.
 * @param {string | number} [props.lowlightColor] - Lowlight color for 'fog' effect.
 * @param {string | number} [props.baseColor] - Base background color for 'fog' effect.
 * @param {number} [props.waveHeight=15] - Wave height for 'waves' effect.
 * @param {number} [props.waveSpeed=0.75] - Wave speed.
 * @param {number} [props.shininess=35] - Shininess multiplier for 'waves'.
 * @param {number} [props.zoom=1.0] - Zoom level.
 * @param {number} [props.speed=1.2] - Animation speed.
 * @param {number} [props.opacity=0.85] - CSS opacity of the canvas container.
 * @param {React.CSSProperties} [props.style] - Additional inline styles.
 */
export default function VantaWaveBackground({
  effectType = 'waves',
  color,
  highlightColor,
  midtoneColor,
  lowlightColor,
  baseColor,
  waveHeight = 15.0,
  waveSpeed = 0.75,
  shininess = 35.0,
  zoom = 1.0,
  speed = 1.2,
  opacity = 0.85,
  style = {},
}) {
  const containerRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  useEffect(() => {
    let isMounted = true;

    const initVanta = async () => {
      try {
        // 1. Ensure Three.js (r134) is loaded
        if (typeof window !== 'undefined' && !window.THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js', 'three-js-cdn');
        }

        // 2. Ensure Vanta script is loaded based on effectType
        if (effectType === 'fog') {
          if (typeof window !== 'undefined' && (!window.VANTA || !window.VANTA.FOG)) {
            await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js', 'vanta-fog-cdn');
          }
        } else {
          if (typeof window !== 'undefined' && (!window.VANTA || !window.VANTA.WAVES)) {
            await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js', 'vanta-waves-cdn');
          }
        }

        if (!isMounted || !containerRef.current) return;

        // Clean up previous instance if any
        if (vantaEffectRef.current) {
          vantaEffectRef.current.destroy();
          vantaEffectRef.current = null;
        }

        // 3. Initialize Vanta effect with custom or adaptive colors
        if (effectType === 'fog' && window.VANTA?.FOG) {
          const finalHighlight = parseColor(highlightColor, isDark ? 0xff6f0f : 0x38bdf8);
          const finalMidtone = parseColor(midtoneColor, isDark ? 0xff5032 : 0x818cf8);
          const finalLowlight = parseColor(lowlightColor, isDark ? 0x463b72 : 0xc084fc);
          const finalBase = parseColor(baseColor, isDark ? 0x090d16 : 0xf8fafc);

          vantaEffectRef.current = window.VANTA.FOG({
            el: containerRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            highlightColor: finalHighlight,
            midtoneColor: finalMidtone,
            lowlightColor: finalLowlight,
            baseColor: finalBase,
            blurFactor: 0.6,
            speed: speed,
            zoom: zoom,
          });
        } else if (window.VANTA?.WAVES) {
          const defaultWaveColor = isDark ? 0x1e1b4b : 0x0284c7;
          const finalColor = parseColor(color, defaultWaveColor);

          vantaEffectRef.current = window.VANTA.WAVES({
            el: containerRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: finalColor,
            shininess: shininess,
            waveHeight: waveHeight,
            waveSpeed: waveSpeed,
            zoom: zoom,
          });
        }
      } catch (err) {
        console.error('Error initializing Vanta background:', err);
      }
    };

    initVanta();

    return () => {
      isMounted = false;
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, [effectType, color, highlightColor, midtoneColor, lowlightColor, baseColor, waveHeight, waveSpeed, shininess, zoom, speed, isDark]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: opacity,
        transition: 'opacity 0.4s ease',
        ...style,
      }}
    />
  );
}
