import { setRequestLocale } from 'next-intl/server';
import { getSection, getSlider } from '@/lib/content';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import Skills from '@/components/sections/Skills';
import Workflow from '@/components/sections/Workflow';
import Counters from '@/components/sections/Counters';
import Testimonials from '@/components/sections/Testimonials';
import Collaborations from '@/components/sections/Collaborations';

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [hero, services, skills, workflow, counters, testimonials, collaborators] = await Promise.all([
    getSection(locale, 'hero'),
    getSection(locale, 'services'),
    getSection(locale, 'skills'),
    getSection(locale, 'workflow'),
    getSection(locale, 'counters'),
    getSlider(locale, 'testimonial'),
    getSection(locale, 'collaborators'),
  ]);

  return (
    <>
      <Hero locale={locale} hero={hero} />
      <Services services={services} />
      <Skills skills={skills} />
      <Workflow workflow={workflow} />
      <Counters counters={counters} />
      <Testimonials testimonials={testimonials} />
      <Collaborations collaborators={collaborators} />
    </>
  );
}
