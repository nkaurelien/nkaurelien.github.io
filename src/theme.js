'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  // Charte Kamitbrains (logo et bannière) : rouge, noir, blanc.
  primaryColor: 'kamit',
  // Teinte 8 (#a90504) en thème clair : texte blanc sur bouton plein ≈ 7.8:1 (le rouge vif
  // #f30a07 de la bannière ≈ 4:1 seulement, réservé aux accents et dégradés).
  primaryShade: { light: 8, dark: 7 },
  defaultRadius: 'md',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontWeight: '700',
  },
  colors: {
    // Rouge Kamitbrains, relevé sur la bannière (public/img/open-graph/kamitbrains.png) :
    // #f30a07 au centre (6), #a90504 (8), #850302 (9) ; bords #4f0202 → #3f0000.
    kamit: ['#fff1f0', '#ffdedc', '#ffbab6', '#ff8f8a', '#fb5f59', '#f6302b', '#f30a07', '#cc0806', '#a90504', '#850302'],
    // Accent secondaire (Material Deep Orange), voisin du rouge : actions secondaires
    // (ex. carte « À propos »), distinctes du rouge Kamitbrains des actions principales.
    deepOrange: ['#fbe9e7', '#ffccbc', '#ffab91', '#ff8a65', '#ff7043', '#ff5722', '#f4511e', '#e64a19', '#d84315', '#bf360c'],
    // Ancienne palette « brand » (indigo) alignée sur la charte : mêmes teintes que kamit.
    brand: ['#fff1f0', '#ffdedc', '#ffbab6', '#ff8f8a', '#fb5f59', '#f6302b', '#f30a07', '#cc0806', '#a90504', '#850302'],
  },
});
