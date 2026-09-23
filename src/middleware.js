import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Gère le routage de locale (redirection `/` -> `/fr`, préfixe toujours présent,
// négociation de langue). Sans ce middleware, tout segment inconnu tombait dans
// la route dynamique `[locale]` (ex. `/robots.txt` -> locale="robots.txt").
export default createMiddleware(routing);

export const config = {
  // Applique le middleware partout SAUF : routes API, proxy analytics Umami (/stats,
  // cf. rewrites de next.config.mjs), internes Next/Vercel, et fichiers avec extension
  // (robots.txt, favicon.ico, images, etc.). Sans /stats ici, POST /stats/api/send/
  // était redirigé vers /fr/stats/api/send/ (404) : aucune visite n'arrivait.
  matcher: ['/((?!api|stats|_next|_vercel|.*\\..*).*)'],
};
