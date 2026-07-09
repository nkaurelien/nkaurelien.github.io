import createNextIntlPlugin from 'next-intl/plugin';

// Validate environment variables at build/startup (t3-env).
import './src/env.mjs';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.js');

// basePath pilote le deploiement :
//  - vide  -> domaine perso ou repo nkaurelien.github.io
//  - /nkaurelien -> GitHub Pages du repo `nkaurelien` (sous-chemin)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
