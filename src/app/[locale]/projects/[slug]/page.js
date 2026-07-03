import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { getProjectSlugs, getProject } from '@/lib/content';
import ProjectDetail from '@/components/sections/ProjectDetail';

export function generateStaticParams() {
  const slugs = new Set();
  for (const locale of routing.locales) {
    getProjectSlugs(locale).forEach(s => slugs.add(s));
  }
  return [...slugs].map(slug => ({ slug }));
}

export default async function ProjectPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const project = getProject(locale, slug);
  if (!project) notFound();

  return <ProjectDetail locale={locale} project={project} />;
}
