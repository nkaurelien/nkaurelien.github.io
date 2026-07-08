import { setRequestLocale } from 'next-intl/server';
import FirebaseDemoClient from './FirebaseDemoClient';

export default async function Page({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FirebaseDemoClient locale={locale} />;
}
