import { setRequestLocale } from 'next-intl/server';
import { getSection, getSlider } from '@/lib/content';
import { getMediumArticles, MEDIUM_PROFILE_URL } from '@/lib/medium';
import Hero from '@/components/sections/Hero';
import CodeBanner from '@/components/sections/CodeBanner';
import AboutIntro from '@/components/sections/AboutIntro';
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

  const [hero, about, services, skills, workflow, counters, testimonials, collaborators, articles] = await Promise.all([
    getSection(locale, 'hero'),
    getSection(locale, 'about'),
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
      <CodeBanner hero={hero} />
      <AboutIntro about={about} />
      <Services services={services} number="02." />
      <Skills skills={skills} number="03." />
      <Workflow workflow={workflow} number="04." />
      <Counters counters={counters} />
      <Testimonials testimonials={testimonials} number="05." />
      <Collaborations collaborators={collaborators} number="06." />
      <Blog locale={locale} articles={articles} compact number="07." profileUrl={MEDIUM_PROFILE_URL} />
    </>
  );
}
