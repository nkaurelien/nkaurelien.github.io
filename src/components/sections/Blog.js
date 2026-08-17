'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Container, Title, Text, Card, Image, Badge, Group, Button, Stack, Box, TextInput, UnstyledButton, ActionIcon, Grid, Paper, Divider } from '@mantine/core';
import { IconArrowUpRight, IconNews, IconArrowRight, IconSearch, IconX, IconFilter, IconTag, IconBrandMedium } from '@tabler/icons-react';

const LABELS = {
  fr: {
    kicker: 'Blog',
    title: 'Articles récents',
    subtitle: 'Mes retours d’expérience DevOps, SysOps et administration système, publiés sur Medium.',
    read: 'Lire l’article',
    seeAll: 'Voir tous les articles',
    onMedium: 'Tout lire sur Medium',
    empty: 'Les articles ne sont pas disponibles pour le moment. Retrouvez-les directement sur Medium.',
    searchTitle: 'Rechercher',
    searchPlaceholder: 'Rechercher un article...',
    tagsTitle: 'Thématiques',
    noResults: 'Aucun article ne correspond à votre recherche.',
    articleCount: count => `${count} article${count > 1 ? 's' : ''}`,
  },
  en: {
    kicker: 'Blog',
    title: 'Recent articles',
    subtitle: 'My hands-on DevOps, SysOps and system administration write-ups, published on Medium.',
    read: 'Read article',
    seeAll: 'See all articles',
    onMedium: 'Read everything on Medium',
    empty: 'Articles are unavailable right now. Find them directly on Medium.',
    searchTitle: 'Search',
    searchPlaceholder: 'Search articles...',
    tagsTitle: 'Topics',
    noResults: 'No articles match your search.',
    articleCount: count => `${count} article${count > 1 ? 's' : ''}`,
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

function ArticleListItem({ article, t }) {
  const isLocal = article.source === 'local';
  const linkProps = isLocal
    ? { component: Link, href: `/${t.__locale}${article.link}` }
    : { component: 'a', href: article.link, target: '_blank', rel: 'noopener noreferrer' };

  return (
    <Card
      {...linkProps}
      withBorder
      padding="lg"
      radius="lg"
      className="blog-card"
      style={{
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
      }}>
      <Group align="center" wrap="nowrap" gap={{ base: 'md', sm: 'xl' }}>
        {article.thumbnail && (
          <Box
            style={{
              width: 150,
              height: 100,
              flexShrink: 0,
              borderRadius: 12,
              overflow: 'hidden',
              display: 'block',
            }}>
            <Image
              src={article.thumbnail}
              h={100}
              w={150}
              fit="cover"
              alt={article.title}
              fallbackSrc="https://placehold.co/600x320?text=Article"
            />
          </Box>
        )}
        <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="xs" c="dimmed" fw={600}>
              {formatDate(article.date, t.__locale)}
            </Text>
            {article.categories?.length > 0 && (
              <Group gap={4}>
                {article.categories.slice(0, 2).map(cat => (
                  <Badge key={cat} size="xs" variant="light" color="blue" radius="sm">
                    {cat}
                  </Badge>
                ))}
              </Group>
            )}
          </Group>
          <Text fw={700} size="md" lineClamp={1} style={{ lineHeight: 1.35 }}>
            {article.title}
          </Text>
          <Text size="sm" c="dimmed" lineClamp={2} style={{ lineHeight: 1.45 }}>
            {article.excerpt}
          </Text>
          <Group gap={4} mt={2} c="blue" style={{ fontWeight: 600, fontSize: '13px' }}>
            {t.read}
            <IconArrowUpRight size={14} />
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

export default function Blog({ articles = [], locale = 'fr', compact = false, profileUrl = 'https://medium.com/@nkaurelien' }) {
  const t = { ...(LABELS[locale] || LABELS.fr), __locale: locale };
  const list = compact ? articles.slice(0, 3) : articles;
  const MEDIUM_PROFILE_URL = profileUrl;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('Tous');

  // Extraction dynamique des catégories avec comptage
  const availableTags = useMemo(() => {
    const counts = {};
    articles.forEach(a => {
      (a.categories || []).forEach(cat => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return [
      { name: 'Tous', count: articles.length },
      ...Object.entries(counts).map(([name, count]) => ({ name, count })),
    ];
  }, [articles]);

  // Filtrage combiné (Recherche textuelle + Tag sélectionné)
  const filteredArticles = useMemo(() => {
    return list.filter(article => {
      if (activeTag !== 'Tous' && !article.categories?.includes(activeTag)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(q) ||
          article.excerpt?.toLowerCase().includes(q) ||
          article.categories?.some(c => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [list, activeTag, searchQuery]);

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

      <Grid gutter="xl">
        {/* Colonne 1: Aside de Gauche (30%): Barre de Recherche + Tag Pills + Medium */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg" style={{ position: 'sticky', top: 90 }}>
            {/* Carte de Recherche */}
            <Paper withBorder p="md" radius="lg">
              <Group gap="xs" mb="xs">
                <IconSearch size={16} color="var(--mantine-color-blue-6)" />
                <Text fw={700} size="sm">
                  {t.searchTitle}
                </Text>
              </Group>
              <TextInput
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.currentTarget.value)}
                rightSection={
                  searchQuery ? (
                    <ActionIcon variant="subtle" size="sm" onClick={() => setSearchQuery('')}>
                      <IconX size={14} />
                    </ActionIcon>
                  ) : null
                }
                radius="md"
                size="sm"
              />
            </Paper>

            {/* Carte des Filtres Pills de Tags */}
            {availableTags.length > 1 && (
              <Paper withBorder p="md" radius="lg">
                <Group gap="xs" mb="xs">
                  <IconTag size={16} color="var(--mantine-color-blue-6)" />
                  <Text fw={700} size="sm">
                    {t.tagsTitle}
                  </Text>
                </Group>
                <Divider mb="sm" />
                <Group gap={6} wrap="wrap">
                  {availableTags.map(tagObj => {
                    const active = activeTag === tagObj.name;
                    return (
                      <UnstyledButton key={tagObj.name} onClick={() => setActiveTag(tagObj.name)}>
                        <Badge
                          size="sm"
                          variant={active ? 'filled' : 'light'}
                          color={active ? 'blue' : 'gray'}
                          radius="xl"
                          style={{
                            cursor: 'pointer',
                            textTransform: 'none',
                            transition: 'all 0.15s ease',
                            fontWeight: active ? 700 : 500,
                          }}>
                          {tagObj.name} ({tagObj.count})
                        </Badge>
                      </UnstyledButton>
                    );
                  })}
                </Group>
              </Paper>
            )}

            {/* Carte Profil Medium */}
            <Paper withBorder p="md" radius="lg">
              <Group gap="xs" mb="xs">
                <IconBrandMedium size={18} color="var(--mantine-color-dark-3)" />
                <Text fw={700} size="sm">
                  Medium
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mb="sm">
                Retrouvez tous mes articles et publications régulières sur Medium.
              </Text>
              <Button
                component="a"
                href={MEDIUM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="light"
                fullWidth
                size="xs"
                rightSection={<IconArrowUpRight size={14} />}>
                {t.onMedium}
              </Button>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Colonne 2: Contenu Principal de Droite (70%): Liste des Articles */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Group justify="space-between" align="center" mb="md">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>
              {t.articleCount(filteredArticles.length)}
            </Text>
            {activeTag !== 'Tous' && (
              <Badge
                variant="filled"
                color="blue"
                size="sm"
                rightSection={
                  <ActionIcon size="xs" color="blue" radius="xl" variant="transparent" onClick={() => setActiveTag('Tous')}>
                    <IconX size={10} color="white" />
                  </ActionIcon>
                }>
                {activeTag}
              </Badge>
            )}
          </Group>

          {filteredArticles.length === 0 ? (
            <Paper withBorder p="xl" radius="lg" ta="center">
              <Text c="dimmed" size="sm">
                {t.noResults}
              </Text>
              {(searchQuery || activeTag !== 'Tous') && (
                <Button
                  variant="light"
                  size="xs"
                  mt="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTag('Tous');
                  }}>
                  Réinitialiser les filtres
                </Button>
              )}
            </Paper>
          ) : (
            <Stack gap="md">
              {filteredArticles.map(article => (
                <ArticleListItem key={article.link} article={article} t={t} />
              ))}
            </Stack>
          )}

          {compact && (
            <Group justify="center" mt="xl">
              <Button component={Link} href={`/${locale}/blog`} variant="filled" rightSection={<IconArrowRight size={16} />}>
                {t.seeAll}
              </Button>
            </Group>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
