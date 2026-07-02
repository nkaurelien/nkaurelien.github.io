import { setRequestLocale } from 'next-intl/server';
import { getSection } from '@/lib/content';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import Counters from '@/components/sections/Counters';

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [hero, services, counters] = await Promise.all([getSection(locale, 'hero'), getSection(locale, 'services'), getSection(locale, 'counters')]);

  return (
    <>
      <Hero locale={locale} hero={hero} />
      <Services services={services} />
      <Counters counters={counters} />
    </>
  );
}
