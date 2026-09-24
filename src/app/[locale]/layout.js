import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { MantineProvider } from '@mantine/core';

import { routing } from '@/i18n/routing';
import { theme } from '@/theme';
import { getApp } from '@/lib/content';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientEffects from '@/components/layout/ClientEffects';
import CvFloatingButton from '@/components/layout/CvFloatingButton';
import HideOnChat from '@/components/layout/HideOnChat';
import { AuthContextProvider } from '@/context/AuthContext';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Active le rendu statique pour cette locale.
  setRequestLocale(locale);

  const messages = await getMessages();
  const app = await getApp(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <AuthContextProvider>
          {/* Lien d'évitement : premier élément focalisable, saute l'en-tête et la navigation. */}
          <a href="#content" className="skip-link visually-hidden" data-testid="skip-link">
            {locale === 'en' ? 'Skip to content' : 'Aller au contenu'}
          </a>
          <Header locale={locale} app={app} />
          <main id="content" tabIndex={-1} data-testid="main-content">
            {children}
          </main>
          <HideOnChat>
            <Footer app={app} />
          </HideOnChat>
          <ClientEffects />
          <HideOnChat>
            <CvFloatingButton />
          </HideOnChat>
        </AuthContextProvider>
      </MantineProvider>
    </NextIntlClientProvider>
  );
}
