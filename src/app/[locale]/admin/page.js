import { setRequestLocale } from 'next-intl/server';
import { getProjects } from '@/lib/content';
import AdminClient from './AdminClient';

export default async function Page({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const localProjects = getProjects(locale);

  return <AdminClient locale={locale} localProjects={localProjects} />;
}
