import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    <Container size="md" py="xl">
      <Anchor component={Link} href={`/${locale}/blog`} size="sm">
        ← Blog
      </Anchor>

      <Title order={1} mt="md" mb="xs">
        {article.title}
      </Title>
      <Group gap="xs" mb="lg">
        <Text size="sm" c="dimmed">
          {formatDate(article.date, locale)}
        </Text>
        {article.categories.map(c => (
          <Badge key={c} variant="light" size="sm">
            {c}
          </Badge>
        ))}
        {article.mediumUrl && (
          <Anchor href={article.mediumUrl} target="_blank" rel="noopener noreferrer" size="sm">
            Aussi sur Medium ↗
          </Anchor>
        )}
      </Group>
      <Divider mb="xl" />

      <Box className="markdown-article" style={{ lineHeight: 1.7 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
      </Box>
    </Container>
  );
}
