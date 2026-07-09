import { setRequestLocale } from 'next-intl/server';
import { getSection, getSlider } from '@/lib/content';
import { getMediumArticles, MEDIUM_PROFILE_URL } from '@/lib/medium';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import Skills from '@/components/sections/Skills';
import Workflow from '@/components/sections/Workflow';
import Counters from '@/components/sections/Counters';
import Testimonials from '@/components/sections/Testimonials';
import Collaborations from '@/components/sections/Collaborations';
import Blog from '@/components/sections/Blog';

// ISR : le flux Medium (teaser blog) est revalidé toutes les 6 h.
export const revalidate = 21600;

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [hero, services, skills, workflow, counters, testimonials, collaborators, articles] = await Promise.all([
    getSection(locale, 'hero'),
    getSection(locale, 'services'),
    getSection(locale, 'skills'),
    getSection(locale, 'workflow'),
    getSection(locale, 'counters'),
    getSlider(locale, 'testimonial'),
    getSection(locale, 'collaborators'),
    getMediumArticles({ limit: 3 }),
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
      <Blog locale={locale} articles={articles} compact profileUrl={MEDIUM_PROFILE_URL} />
    </>
  );
}
