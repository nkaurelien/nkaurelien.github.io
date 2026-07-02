import '@mantine/core/styles.css';
import './globals.css';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';

export const metadata = {
  title: 'Aurelien NKUMBE — Développeur Fullstack & DevOps',
  description: "Portfolio d'Aurelien NKUMBE, développeur full-stack polyvalent, DevOps et MOE.",
  icons: { icon: '/favicon-32x32.png' },
};

// Layout racine : rend <html>/<body> et injecte le script de color-scheme Mantine.
// Les providers dependants de la locale sont dans app/[locale]/layout.js.
export default function RootLayout({ children }) {
  return (
    <html lang="fr" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </head>
      <body>{children}</body>
    </html>
  );
}
