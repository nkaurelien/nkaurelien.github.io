'use client';

import { usePathname } from 'next/navigation';

// Page de chat « AI-native » : interface épurée (minimal chrome). Le pied de page et le
// bouton CV flottant sont masqués sur /fr/chat/ et /en/chat/ ; le bouton flottant
// chevauchait en plus la zone de saisie fixée en bas sur mobile.
export const isChatPath = pathname => /^\/(fr|en)\/chat\/?$/.test(pathname || '');

export default function HideOnChat({ children }) {
  const pathname = usePathname();
  return isChatPath(pathname) ? null : children;
}
