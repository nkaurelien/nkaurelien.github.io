import { setRequestLocale } from 'next-intl/server';
import { getSection, getSlider } from '@/lib/content';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import Counters from '@/components/sections/Counters';
import Testimonials from '@/components/sections/Testimonials';

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [hero, services, counters, testimonials] = await Promise.all([
    getSection(locale, 'hero'),
    getSection(locale, 'services'),
    getSection(locale, 'counters'),
    getSlider(locale, 'testimonial'),
  ]);

  return (
    <>
      <Hero locale={locale} hero={hero} />
      <Services services={services} />
      <Counters counters={counters} />
      <Testimonials testimonials={testimonials} />
    </>
  );
}
