import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Note : la middleware ne s'execute pas sur l'hebergement statique (GitHub Pages).
// Elle sert uniquement en `next dev` / `next start`. Le routing des locales en prod
// repose sur l'export statique (dossiers /fr et /en) + la redirection racine.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
