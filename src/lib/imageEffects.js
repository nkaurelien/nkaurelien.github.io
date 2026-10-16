'use client';

import { useState, useEffect } from 'react';

// Cache mémoire côté client pour éviter de recalculer les dégradés / filtres au changement de vue.
const gradientCache = new Map();
const filterCache = new Map();

// Palette de repli aux couleurs Kamitbrains si l'image est externe (CORS) ou monochrome.
const FALLBACK_GRADIENT = {
  primary: 'rgb(169, 5, 4)',
  secondary: 'rgb(45, 8, 8)',
  gradeLinear: 'linear-gradient(135deg, rgb(185, 16, 14) 0%, rgb(32, 6, 8) 100%)',
  linear: 'linear-gradient(135deg, rgba(169, 5, 4, 0.88) 0%, rgba(216, 67, 21, 0.6) 100%)',
  ambilight:
    'radial-gradient(ellipse at 25% 30%, rgba(169, 5, 4, 0.65) 0%, transparent 65%), radial-gradient(ellipse at 75% 75%, rgba(216, 67, 21, 0.5) 0%, transparent 65%)',
  surfaceBg:
    'radial-gradient(ellipse at 25% 25%, rgba(169, 5, 4, 0.42) 0%, transparent 62%), radial-gradient(ellipse at 80% 80%, rgba(216, 67, 21, 0.3) 0%, transparent 62%), #120909',
};

/**
 * Algorithme inspiré de `grade-js` (benhowdle89/grade) :
 * Échantillonne une image sur un canvas hors-écran, filtre les fonds blancs/gris/noirs
 * des captures d'écran web et pondère par saturation pour extraire les 2 vraies couleurs
 * dominantes complémentaires de chaque visuel.
 */
export function extractDominantGradient(src) {
  if (!src || typeof window === 'undefined') {
    return Promise.resolve(FALLBACK_GRADIENT);
  }
  if (gradientCache.has(src)) {
    return Promise.resolve(gradientCache.get(src));
  }

  return new Promise(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(FALLBACK_GRADIENT);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const chroma = max - min;

          // Ignore les blancs/gris clairs de fond de page web et les noirs purs.
          if (max > 210 && chroma < 36) continue;
          if (max < 22) continue;

          // Quantification par pas de 20 pour regrouper les teintes proches.
          const qr = Math.min(255, Math.round(r / 20) * 20);
          const qg = Math.min(255, Math.round(g / 20) * 20);
          const qb = Math.min(255, Math.round(b / 20) * 20);
          const key = `${qr}|${qg}|${qb}`;

          // Forte pondération des pixels chromatiques (couleurs d'accent du projet).
          const weight = 1 + Math.pow(chroma / 255, 1.5) * 14;
          const entry = buckets.get(key);
          if (entry) {
            entry.weight += weight;
          } else {
            buckets.set(key, { r: qr, g: qg, b: qb, chroma, weight });
          }
        }

        const sorted = [...buckets.values()].sort((a, b) => b.weight - a.weight);
        if (sorted.length === 0) {
          resolve(FALLBACK_GRADIENT);
          return;
        }

        const first = sorted[0];
        // Choisit une 2e couleur distincte, ou génère une teinte complémentaire profonde (comme grade-js).
        const secondCandidate = sorted.find(c => Math.hypot(c.r - first.r, c.g - first.g, c.b - first.b) > 70);
        const second = secondCandidate || {
          r: Math.max(12, Math.round(first.r * 0.28)),
          g: Math.max(12, Math.round(first.g * 0.28)),
          b: Math.max(16, Math.round(first.b * 0.32)),
        };

        // Trie par luminosité perçue (formule BT.601 de grade-js).
        const brightness = c => (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
        const [brighter, darker] = brightness(first) >= brightness(second) ? [first, second] : [second, first];

        // Assure un bon contraste entre les 2 pôles du dégradé.
        const dR = brightness(darker) > 150 ? Math.round(darker.r * 0.45) : darker.r;
        const dG = brightness(darker) > 150 ? Math.round(darker.g * 0.45) : darker.g;
        const dB = brightness(darker) > 150 ? Math.round(darker.b * 0.45) : darker.b;

        const c1 = `${brighter.r}, ${brighter.g}, ${brighter.b}`;
        const c2 = `${dR}, ${dG}, ${dB}`;

        const result = {
          primary: `rgb(${c1})`,
          secondary: `rgb(${c2})`,
          gradeLinear: `linear-gradient(135deg, rgb(${c1}) 0%, rgb(${c2}) 100%)`,
          linear: `linear-gradient(135deg, rgba(${c1}, 0.9) 0%, rgba(${c2}, 0.78) 100%)`,
          ambilight: `radial-gradient(ellipse at 25% 30%, rgba(${c1}, 0.65) 0%, transparent 65%), radial-gradient(ellipse at 75% 75%, rgba(${c2}, 0.55) 0%, transparent 65%)`,
          surfaceBg: `radial-gradient(ellipse at 25% 25%, rgba(${c1}, 0.48) 0%, transparent 65%), radial-gradient(ellipse at 80% 80%, rgba(${c2}, 0.38) 0%, transparent 65%), #120c0c`,
        };

        gradientCache.set(src, result);
        resolve(result);
      } catch {
        resolve(FALLBACK_GRADIENT);
      }
    };

    img.onerror = () => resolve(FALLBACK_GRADIENT);
    img.src = src;
  });
}

/**
 * Hook React pour récupérer le dégradé dominant d'une image (façon `grade-js`).
 */
export function useImageGradient(src) {
  const [gradient, setGradient] = useState(() => (src && gradientCache.get(src)) || FALLBACK_GRADIENT);

  useEffect(() => {
    if (!src) {
      setGradient(FALLBACK_GRADIENT);
      return;
    }
    let cancelled = false;
    extractDominantGradient(src).then(res => {
      if (!cancelled) setGradient(res);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return gradient;
}

/**
 * Pipeline de filtres de vision par ordinateur inspiré de `lena.js` (davidsonfellipe/lena.js) :
 * - `canny` : lissage gaussien 5x5 + gradient de Sobel + seuillage hystérésis teinté cyber-Kamitbrains
 * - `sobel` : opérateurs de convolution Sobel horizontal + vertical
 * - `highpass` : filtre passe-haut 3x3 accentuant les micro-structures
 */
function convolveGrayscale(gray, width, height, kernel, kSize, divisor = 1) {
  const half = Math.floor(kSize / 2);
  const out = new Float32Array(width * height);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let sum = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const val = gray[(y + ky) * width + (x + kx)];
          const weight = kernel[(ky + half) * kSize + (kx + half)];
          sum += val * weight;
        }
      }
      out[y * width + x] = sum / divisor;
    }
  }
  return out;
}

export function renderLenaFilterToDataUrl(src, mode = 'canny') {
  if (!src || mode === 'original' || typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  const cacheKey = `${src}::${mode}`;
  if (filterCache.has(cacheKey)) {
    return Promise.resolve(filterCache.get(cacheKey));
  }

  return new Promise(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const maxDim = 420;
        const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim));
        const width = Math.max(1, Math.round((img.width || 380) * scale));
        const height = Math.max(1, Math.round((img.height || 475) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;

        // 1. Conversion en niveaux de gris (pondération lena.js : 0.2126 R + 0.7152 G + 0.0722 B)
        const gray = new Float32Array(width * height);
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          gray[p] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }

        if (mode === 'canny' || mode === 'sobel') {
          // 2. Filtre gaussien 5x5 (lena.js gaussian) pour réduire le bruit en mode Canny
          const gaussianKernel = [2, 4, 5, 4, 2, 4, 9, 12, 9, 4, 5, 12, 15, 12, 5, 4, 9, 12, 9, 4, 2, 4, 5, 4, 2];
          const smoothed = mode === 'canny' ? convolveGrayscale(gray, width, height, gaussianKernel, 5, 159) : gray;

          // 3. Opérateurs de Sobel horizontal et vertical (lena.js sobelHorizontal / sobelVertical)
          const gxKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
          const gyKernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
          const gx = convolveGrayscale(smoothed, width, height, gxKernel, 3, 1);
          const gy = convolveGrayscale(smoothed, width, height, gyKernel, 3, 1);

          const mag = new Float32Array(width * height);
          for (let p = 0; p < mag.length; p++) {
            mag[p] = Math.hypot(gx[p], gy[p]);
          }

          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const p = y * width + x;
              const idx = p * 4;
              let m = mag[p];

              // Suppression des non-maxima locale en mode Canny
              if (mode === 'canny') {
                const angle = Math.atan2(gy[p], gx[p]) * (180 / Math.PI);
                const normAngle = angle < 0 ? angle + 180 : angle;
                let n1 = 0;
                let n2 = 0;
                if ((normAngle >= 0 && normAngle < 22.5) || (normAngle >= 157.5 && normAngle <= 180)) {
                  n1 = mag[p - 1];
                  n2 = mag[p + 1];
                } else if (normAngle >= 22.5 && normAngle < 67.5) {
                  n1 = mag[(y - 1) * width + (x + 1)];
                  n2 = mag[(y + 1) * width + (x - 1)];
                } else if (normAngle >= 67.5 && normAngle < 112.5) {
                  n1 = mag[(y - 1) * width + x];
                  n2 = mag[(y + 1) * width + x];
                } else {
                  n1 = mag[(y - 1) * width + (x - 1)];
                  n2 = mag[(y + 1) * width + (x + 1)];
                }
                if (m < n1 || m < n2) m = 0;
              }

              const intensity = Math.min(255, m);
              if (mode === 'canny') {
                // Rendu Canny IA aux couleurs Kamitbrains : contours forts en blanc/corail, contours moyens en rouge Kamitbrains sur fond carbone.
                const strong = intensity > 68;
                const weak = intensity > 28;
                if (strong) {
                  data[idx] = 255;
                  data[idx + 1] = 225;
                  data[idx + 2] = 220;
                } else if (weak) {
                  const ratio = (intensity - 28) / 40;
                  data[idx] = Math.round(169 + ratio * 82);
                  data[idx + 1] = Math.round(12 + ratio * 75);
                  data[idx + 2] = Math.round(12 + ratio * 70);
                } else {
                  // Conserve une silhouette très subtile de l'image d'origine en arrière-plan.
                  const bg = gray[p] * 0.08;
                  data[idx] = Math.round(12 + bg);
                  data[idx + 1] = Math.round(9 + bg * 0.7);
                  data[idx + 2] = Math.round(10 + bg * 0.7);
                }
              } else {
                // Mode Sobel Matrix : intensité directe teintée ambre/rouge technique
                const norm = intensity / 255;
                data[idx] = Math.min(255, Math.round(14 + norm * 255));
                data[idx + 1] = Math.min(255, Math.round(10 + Math.pow(norm, 1.45) * 190));
                data[idx + 2] = Math.min(255, Math.round(12 + Math.pow(norm, 1.8) * 165));
              }
              data[idx + 3] = 255;
            }
          }
        } else if (mode === 'highpass') {
          // Filtre Highpass 3x3 de lena.js : [-1, -1, -1, -1, 8, -1, -1, -1, -1]
          const hpKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
          const hp = convolveGrayscale(gray, width, height, hpKernel, 3, 1);
          for (let p = 0; p < hp.length; p++) {
            const idx = p * 4;
            const val = Math.max(0, Math.min(255, hp[p] + gray[p] * 0.45));
            data[idx] = Math.min(255, Math.round(val * 1.08));
            data[idx + 1] = Math.round(val * 0.88);
            data[idx + 2] = Math.round(val * 0.88);
            data[idx + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const url = canvas.toDataURL('image/png');
        filterCache.set(cacheKey, url);
        resolve(url);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = src;
  });
}
