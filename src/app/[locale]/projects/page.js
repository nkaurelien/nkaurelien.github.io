import { setRequestLocale } from 'next-intl/server';
import { getApp, getProjects } from '@/lib/content';
import ProjectsGrid from '@/components/sections/ProjectsGrid';

export default async function ProjectsPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const app = await getApp(locale);
  const projects = getProjects(locale);

  return <ProjectsGrid projects={projects} meta={app?.projects} />;
}
