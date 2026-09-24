import '@mantine/core/styles.css';
import './globals.css';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';

export const metadata = {
  title: 'Astrid-Aurélien NKUMBE — DevSecOps / Platform Engineer & Tech Lead',
  description:
    "Portfolio d'Astrid-Aurélien NKUMBE, DevSecOps / Platform Engineer & Tech Lead — architectures sécurisées et conformes (santé/HDS, RGPD), IA appliquée, de la spec à la prod.",
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
        {/* Documents lisibles par les humains et les IA (llms.txt, bio Markdown). */}
        <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />
        <link rel="alternate" type="text/markdown" title="À propos (Markdown)" href="/about.md" />
        {/* Tracking Umami Analytics (proxy local /stats/ anti ad-blocker) */}
        <script defer src="/stats/script.js" data-website-id="37569a74-7d82-44fc-b839-525d4604c9b8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
