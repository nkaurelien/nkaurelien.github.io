'use client';

import Link from 'next/link';
import { Container, Title, Text, SimpleGrid, Card, Image, Badge, Group, Button, Stack, Box } from '@mantine/core';
import { IconArrowUpRight, IconNews, IconArrowRight } from '@tabler/icons-react';

const LABELS = {
  fr: {
    kicker: 'Blog',
    title: 'Articles récents',
    subtitle: 'Mes retours d’expérience DevOps, SysOps et administration système, publiés sur Medium.',
    read: 'Lire l’article',
    seeAll: 'Voir tous les articles',
    onMedium: 'Tout lire sur Medium',
    empty: 'Les articles ne sont pas disponibles pour le moment. Retrouvez-les directement sur Medium.',
  },
  en: {
    kicker: 'Blog',
    title: 'Recent articles',
    subtitle: 'My hands-on DevOps, SysOps and system administration write-ups, published on Medium.',
    read: 'Read article',
    seeAll: 'See all articles',
    onMedium: 'Read everything on Medium',
    empty: 'Articles are unavailable right now. Find them directly on Medium.',
  },
};

function formatDate(date, locale) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return '';
  }
}

function ArticleCard({ article, t }) {
  // Article local (markdown du site) → lien interne ; article Medium → lien externe.
  const isLocal = article.source === 'local';
  const linkProps = isLocal
    ? { component: Link, href: `/${t.__locale}${article.link}` }
    : { component: 'a', href: article.link, target: '_blank', rel: 'noopener noreferrer' };
  return (
    <Card
      {...linkProps}
      withBorder
      padding="lg"
      radius="md"
      className="blog-card"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease' }}>
      {article.thumbnail && (
        <Card.Section>
          <Image src={article.thumbnail} height={160} alt={article.title} fallbackSrc="https://placehold.co/600x320?text=Article" />
        </Card.Section>
      )}

      <Stack gap="xs" mt={article.thumbnail ? 'md' : 0} style={{ flex: 1 }}>
        <Text size="xs" c="dimmed">
          {formatDate(article.date, t.__locale)}
        </Text>
        <Text fw={600} size="md" lineClamp={2} style={{ lineHeight: 1.3 }}>
          {article.title}
        </Text>
        <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
          {article.excerpt}
        </Text>

        {article.categories?.length > 0 && (
          <Group gap={6} mt={4}>
            {article.categories.slice(0, 3).map(cat => (
              <Badge key={cat} size="xs" variant="light" color="blue">
                {cat}
              </Badge>
            ))}
          </Group>
        )}

        <Group gap={4} mt="sm" c="blue" style={{ fontWeight: 600, fontSize: '13px' }}>
          {t.read}
          <IconArrowUpRight size={14} />
        </Group>
      </Stack>
    </Card>
  );
}

export default function Blog({ articles = [], locale = 'fr', compact = false, profileUrl = 'https://medium.com/@nkaurelien' }) {
  const t = { ...(LABELS[locale] || LABELS.fr), __locale: locale };
  const list = compact ? articles.slice(0, 3) : articles;
  const MEDIUM_PROFILE_URL = profileUrl;

  return (
    <Container size="lg" py={compact ? 'xl' : 60}>
      <Stack align="center" gap="xs" mb="xl">
        <Group gap={6} c="blue">
          <IconNews size={18} />
          <Text fw={700} size="sm" tt="uppercase" style={{ letterSpacing: '1px' }}>
            {t.kicker}
          </Text>
        </Group>
        <Title order={compact ? 3 : 2} ta="center">
          {t.title}
        </Title>
        <Text c="dimmed" ta="center" size="sm" style={{ maxWidth: 560, lineHeight: 1.5 }}>
          {t.subtitle}
        </Text>
      </Stack>

      {list.length === 0 ? (
        <Box ta="center">
          <Text c="dimmed" size="sm" mb="md">
            {t.empty}
          </Text>
          <Button
            component="a"
            href={MEDIUM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            rightSection={<IconArrowUpRight size={16} />}>
            {t.onMedium}
          </Button>
        </Box>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {list.map(article => (
              <ArticleCard key={article.link} article={article} t={t} />
            ))}
          </SimpleGrid>

          <Group justify="center" mt="xl" gap="sm">
            {compact && (
              <Button component={Link} href={`/${locale}/blog`} variant="filled" rightSection={<IconArrowRight size={16} />}>
                {t.seeAll}
              </Button>
            )}
            <Button
              component="a"
              href={MEDIUM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="subtle"
              rightSection={<IconArrowUpRight size={16} />}>
              {t.onMedium}
            </Button>
          </Group>
        </>
      )}
    </Container>
  );
}
