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
          <Header locale={locale} app={app} />
          <main>{children}</main>
          <Footer app={app} />
          <ClientEffects />
        </AuthContextProvider>
      </MantineProvider>
    </NextIntlClientProvider>
  );
}
