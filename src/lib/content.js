import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

// Charge les donnees JSON d'une locale (app + une section).
export async function getApp(locale) {
  return (await import(`../data/${locale}/app.json`)).default;
}

export async function getSection(locale, name) {
  return (await import(`../data/${locale}/sections/${name}.json`)).default;
}

export async function getSlider(locale, name) {
  return (await import(`../data/${locale}/sliders/${name}.json`)).default;
}

// Charge les projets actifs (fichiers *.md, hors *.md.off) depuis /public/projects/<locale>.
export function getProjects(locale) {
  const dir = path.join(process.cwd(), 'public', 'projects', locale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title || '',
        image: data.image || '',
        category: data.category || '',
        categorySlug: data.category_slug || '',
        description: data.description?.content || '',
        link: data.description?.button?.link || null,
        linkLabel: data.description?.button?.label || 'Voir',
        active: data.active !== false,
        content,
      };
    })
    .filter(p => p.active);
}

// Liste des slugs de projets actifs (pour generateStaticParams).
export function getProjectSlugs(locale) {
  return getProjects(locale).map(p => p.slug);
}

// Charge un projet complet (description, details, carousel) par slug.
export function getProject(locale, slug) {
  const fp = path.join(process.cwd(), 'public', 'projects', locale, `${slug}.md`);
  if (!fs.existsSync(fp)) return null;
  const { data, content } = matter(fs.readFileSync(fp, 'utf-8'));
  return {
    slug,
    title: data.title || '',
    image: data.image || '',
    category: data.category || '',
    categorySlug: data.category_slug || '',
    description: data.description?.content || '',
    link: data.description?.button?.link || null,
    linkLabel: data.description?.button?.label || 'Voir le site',
    details: data.details || null,
    carousel: data.carousel || [],
    content,
  };
}
