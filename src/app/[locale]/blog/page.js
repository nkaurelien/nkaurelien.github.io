import { setRequestLocale } from 'next-intl/server';
import { getMediumArticles, MEDIUM_PROFILE_URL } from '@/lib/medium';
import Blog from '@/components/sections/Blog';

// ISR : revalide le flux Medium toutes les 6 h.
export const revalidate = 21600;

export default async function BlogPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const articles = await getMediumArticles();

  return <Blog locale={locale} articles={articles} profileUrl={MEDIUM_PROFILE_URL} />;
}
