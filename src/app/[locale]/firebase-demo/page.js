import { setRequestLocale } from 'next-intl/server';
import FirebaseDemoClient from './FirebaseDemoClient';

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

export default async function Page({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FirebaseDemoClient locale={locale} />;
}
