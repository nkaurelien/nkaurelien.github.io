import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Gère le routage de locale (redirection `/` -> `/fr`, préfixe toujours présent,
// négociation de langue). Sans ce middleware, tout segment inconnu tombait dans
// la route dynamique `[locale]` (ex. `/robots.txt` -> locale="robots.txt").
export default createMiddleware(routing);

export const config = {
  // Applique le middleware partout SAUF : routes API, internes Next/Vercel,
  // et fichiers avec extension (robots.txt, favicon.ico, images, etc.).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
