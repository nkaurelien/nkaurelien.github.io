import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import MarkdownContent from '@/components/blog/MarkdownContent';
import { Container, Title, Text, Badge, Group, Anchor, Divider, Box } from '@mantine/core';
import { getLocalArticle, getLocalArticles } from '@/lib/localArticles';

// Articles markdown locaux (datasources/articles/) — rendus sur le site,
// migrés manuellement vers Medium ensuite (front matter `medium:` une fois fait).

export function generateStaticParams() {
  return getLocalArticles().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getLocalArticle(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

function formatDate(date, locale) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return '';
  }
}

export default async function LocalArticlePage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = getLocalArticle(slug);
  if (!article) notFound();

  return (
    <Container size="md" py="xl" component="article" aria-labelledby="article-title" data-testid="article" data-slug={slug}>
      <Anchor component={Link} href={`/${locale}/blog`} size="sm" data-testid="article-back">
        <span aria-hidden="true">← </span>Blog
      </Anchor>

      <Title order={1} mt="md" mb="xs" id="article-title" data-testid="article-title">
        {article.title}
      </Title>
      <Group gap="xs" mb="lg">
        <Text component="time" dateTime={article.date} size="sm" c="dimmed" data-testid="article-date">
          {formatDate(article.date, locale)}
        </Text>
        {article.categories.map(c => (
          <Badge key={c} variant="light" size="sm">
            {c}
          </Badge>
        ))}
        {article.mediumUrl && (
          <Anchor href={article.mediumUrl} target="_blank" rel="noopener noreferrer" size="sm" data-testid="article-medium">
            Aussi sur Medium <span aria-hidden="true">↗</span>
            <span className="visually-hidden"> (nouvel onglet)</span>
          </Anchor>
        )}
      </Group>
      <Divider mb="xl" />

      <Box className="markdown-article" data-testid="article-content" style={{ lineHeight: 1.7 }}>
        <MarkdownContent content={article.content} />
      </Box>
    </Container>
  );
}
