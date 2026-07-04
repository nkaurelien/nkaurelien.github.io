import { setRequestLocale } from 'next-intl/server';
import { getSection } from '@/lib/content';
import Company from '@/components/sections/Company';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const company = await getSection(locale, 'company');
  return {
    title: company?.title || 'Kamitbrains',
    description: company?.subtitle || 'Kamitbrains details',
  };
}

export default async function KamitbrainsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const company = await getSection(locale, 'company');

  return <Company company={company} />;
}
