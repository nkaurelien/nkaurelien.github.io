'use client';

import { usePathname } from 'next/navigation';

// Page de chat « AI-native » : interface épurée (minimal chrome). Le pied de page et le
// bouton CV flottant sont masqués sur /fr/chat/ et /en/chat/ ; le bouton flottant
// chevauchait en plus la zone de saisie fixée en bas sur mobile.
export const isChatPath = pathname => /^\/(fr|en)\/chat\/?$/.test(pathname || '');

// Pages où le bouton CV flottant est aussi masqué : Kamitbrains, contact et tout le blog
// (liste + articles), où il gênait la lecture ou doublait les actions de la page.
export const isCvButtonHiddenPath = pathname => isChatPath(pathname) || /^\/(fr|en)\/(kamitbrains|contact|blog)(\/|$)/.test(pathname || '');

// scope="cv" : règle du bouton CV (prop chaîne : le layout serveur ne peut pas passer de fonction).
export default function HideOnChat({ children, scope }) {
  const pathname = usePathname();
  const hidden = scope === 'cv' ? isCvButtonHiddenPath(pathname) : isChatPath(pathname);
  return hidden ? null : children;
}
