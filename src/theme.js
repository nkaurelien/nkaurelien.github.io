'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  // Teinte 8 en thème clair (Mantine utilise 6 par défaut) : les variantes filled/light et
  // les textes colorés (bleu, indigo, gris…) atteignent le contraste WCAG AA de 4.5:1.
  primaryShade: { light: 8, dark: 8 },
  defaultRadius: 'md',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontWeight: '700',
  },
  colors: {
    // Palette d'accent du portfolio
    brand: ['#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81'],
  },
});
