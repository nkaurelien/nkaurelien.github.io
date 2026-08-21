'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Card,
  Image,
  Badge,
  Group,
  Button,
  Stack,
  Box,
  TextInput,
  UnstyledButton,
  ActionIcon,
  Grid,
  Paper,
  Divider,
  ThemeIcon,
} from '@mantine/core';
import {
  IconArrowUpRight,
  IconNews,
  IconArrowRight,
  IconSearch,
  IconX,
  IconFilter,
  IconTag,
  IconBrandMedium,
  IconBulb,
  IconClock,
  IconBook,
  IconWriting,
} from '@tabler/icons-react';

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

const UPCOMING_ARTICLES = [
  {
    title: 'Du Monolithe au RAG : Ingestion vectorielle & RAG de +500 documents RH/Paie',
    category: 'IA & RAG',
    project: 'SmartDataPay (YSO Conseils / KAZAC)',
    status: 'En rédaction',
    excerpt:
      "Retour d'expérience sur la création d'un pipeline ETL d'ingestion (Chunking, Embeddings Supabase pgvector / Qdrant) et l'intégration combinée d'OpenAI (GPT-4o) et Ollama (Llama 3 local) sous Next.js & LangChain.",
    tags: ['LangChain', 'LiteLLM', 'OpenAI', 'Ollama', 'pgvector', 'Python'],
    targetDate: 'Bientôt sur Medium',
  },
  {
    title: 'Télésanté & IoT : Collecter des flux de constantes physiologiques en temps réel (FHIR / HL7)',
    category: 'IoT & Santé',
    project: 'DATA2INNOV (Projet Santé Connectée)',
    status: 'Planifié',
    excerpt:
      "Architecture d'acquisition temps réel avec capteurs IoT médicaux (EmotiBit, ESP32, Bangle.js, Withings Cloud API), application mobile Flutter BLE/Wi-Fi et observabilité SigNoz / ELK sous Docker Swarm.",
    tags: ['FastAPI', 'FHIR/HL7', 'Flutter', 'WebSockets', 'Kafka', 'SigNoz'],
    targetDate: 'Prochainement',
  },
  {
    title: 'Sécuriser une API bancaire critique avec Kong API Gateway & Active Directory LDAP',
    category: 'Banque & Security',
    project: 'SCB Cameroun (Attijariwafa Bank)',
    status: 'Planifié',
    excerpt:
      "Comment router, appliquer du rate-limiting anti-DDoS et authentifier par LDAP/RBAC d'entreprise la distribution de +100 000 relevés de comptes chiffrés par email.",
    tags: ['Kong Gateway', 'Vue.js', 'Laravel', 'LDAP', 'Kubernetes', 'Argo CD'],
    targetDate: 'Prochainement',
  },
  {
    title: 'Flutter & Google Cloud Vision API : Scanner des tickets de caisse en FinTech',
    category: 'FinTech & Mobile',
    project: 'Korée Africa FinTech',
    status: 'Idée / Brouillon',
    excerpt:
      "Implémentation de l'OCR mobile pour l'attribution automatique de cashback, gestion de l'authentification biométrique et notifications push avec fallbacks hybrides (OneSignal / AWS SNS).",
    tags: ['Flutter', 'Dart', 'Google Cloud Vision', 'Laravel', 'AWS SNS', 'Snyk'],
    targetDate: 'Brouillon',
  },
  {
    title: 'Dev Agentique & Spec-Driven Development : Automatiser son SDLC avec Claude Code & SpecKit',
    category: 'Dev & IA',
    project: 'Antigravity & GitHub SpecKit',
    status: 'En rédaction',
    excerpt:
      'Comment structurer des spécifications formelles (Markdown Spec, Plan, Tasks) et orchestrer des agents IA avec MCP (Model Context Protocol) et justfile pour produire du code zéro-dette.',
    tags: ['Claude Code', 'Antigravity', 'GitHub SpecKit', 'MCP', 'justfile'],
    targetDate: 'Bientôt sur Medium',
  },
  {
    title: 'Monorepo Frontend sans Nx : Organiser 5 applications Angular dans un repository unique',
    category: 'Architecture Web',
    project: 'Multi Canal Services & BPCE Coface',
    status: 'Idée / Brouillon',
    excerpt:
      "Astuces d'architecture dans angular.json, optimisation de la taille des bundles (Tree shaking, Lazy loading) et pre-rendering SEO avec Puppeteer Headless.",
    tags: ['Angular', 'TypeScript', 'RxJS', 'Puppeteer', 'Pnpm', 'Cypress'],
    targetDate: 'Brouillon',
  },
];

function UpcomingArticleCard({ article, locale }) {
  return (
    <Card
      withBorder
      padding="md"
      radius="lg"
      style={{
        backgroundColor: 'var(--mantine-color-body)',
        borderLeft: '4px solid var(--mantine-color-indigo-5)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}>
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge variant="filled" color="indigo" size="xs" radius="sm">
              💡 {article.category}
            </Badge>
            <Badge variant="dot" color={article.status === 'En rédaction' ? 'green' : 'orange'} size="xs">
              {article.status}
            </Badge>
          </Group>
          <Badge variant="outline" color="gray" size="xs">
            {article.targetDate}
          </Badge>
        </Group>

        <Text fw={700} size="sm" lineClamp={2} style={{ lineHeight: 1.35 }}>
          {article.title}
        </Text>

        <Text size="xs" c="dimmed" lineClamp={3} style={{ lineHeight: 1.45 }}>
          {article.excerpt}
        </Text>

        <Group justify="space-between" align="center" mt={4}>
          <Text size="xs" fw={600} c="dimmed">
            📌 Projet lié : <span style={{ color: 'var(--mantine-color-text)' }}>{article.project}</span>
          </Text>
          <Group gap={4}>
            {article.tags.slice(0, 3).map(tag => (
              <Badge key={tag} size="xs" variant="light" color="gray" radius="xs">
                {tag}
              </Badge>
            ))}
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}

function FeaturedArticleCard({ article, t }) {
  if (!article) return null;
  const isLocal = article.source === 'local';
  const linkProps = isLocal
    ? { component: Link, href: `/${t.__locale}${article.link}` }
    : { component: 'a', href: article.link, target: '_blank', rel: 'noopener noreferrer' };

  return (
    <Card
      {...linkProps}
      withBorder
      padding="lg"
      radius="xl"
      className="blog-featured-card"
      style={{
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
      }}>
      <Grid align="center" gutter={{ base: 'md', sm: 'xl' }}>
        {article.thumbnail && (
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <Box
              style={{
                height: 180,
                borderRadius: 14,
                overflow: 'hidden',
                display: 'block',
              }}>
              <Image
                src={article.thumbnail}
                h={180}
                w="100%"
                fit="cover"
                alt={article.title}
                fallbackSrc="https://placehold.co/600x320?text=Article"
              />
            </Box>
          </Grid.Col>
        )}
        <Grid.Col span={{ base: 12, sm: article.thumbnail ? 7 : 12 }}>
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Badge variant="filled" color="blue" size="xs" radius="sm">
                📌 {t.__locale === 'en' ? 'FEATURED' : 'À LA UNE'}
              </Badge>
              <Text size="xs" c="dimmed" fw={600}>
                {formatDate(article.date, t.__locale)}
              </Text>
            </Group>

            <Title order={4} style={{ lineHeight: 1.3 }}>
              {article.title}
            </Title>

            <Text size="sm" c="dimmed" lineClamp={2} style={{ lineHeight: 1.45 }}>
              {article.excerpt}
            </Text>

            <Group justify="space-between" align="center" mt="xs">
              {article.categories?.length > 0 && (
                <Group gap={4}>
                  {article.categories.slice(0, 3).map(cat => (
                    <Badge key={cat} size="xs" variant="light" color="blue" radius="sm">
                      {cat}
                    </Badge>
                  ))}
                </Group>
              )}
              <Group gap={4} c="blue" style={{ fontWeight: 700, fontSize: '13px' }}>
                {t.read}
                <IconArrowUpRight size={15} />
              </Group>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </Card>
  );
}

function CompactArticleRow({ article, t }) {
  const isLocal = article.source === 'local';
  const linkProps = isLocal
    ? { component: Link, href: `/${t.__locale}${article.link}` }
    : { component: 'a', href: article.link, target: '_blank', rel: 'noopener noreferrer' };

  return (
    <Paper
      {...linkProps}
      withBorder
      p="sm"
      radius="md"
      style={{
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
      }}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed" fw={600} style={{ flexShrink: 0, width: 85 }}>
            {formatDate(article.date, t.__locale)}
          </Text>
          <Text size="sm" fw={600} lineClamp={1} style={{ flex: 1 }}>
            {article.title}
          </Text>
        </Group>

        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          {article.categories?.[0] && (
            <Badge size="xs" variant="subtle" color="gray" visibleFrom="xs">
              {article.categories[0]}
            </Badge>
          )}
          <ActionIcon size="sm" variant="subtle" color="blue">
            <IconArrowUpRight size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
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
      padding="md"
      radius="lg"
      className="blog-card"
      style={{
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
      }}>
      <Group align="center" wrap={{ base: 'wrap', sm: 'nowrap' }} gap={{ base: 'md', sm: 'lg' }}>
        {article.thumbnail && (
          <Box
            style={{
              width: '100%',
              maxWidth: 150,
              height: 95,
              flexShrink: 0,
              borderRadius: 10,
              overflow: 'hidden',
              display: 'block',
            }}>
            <Image src={article.thumbnail} h={95} w="100%" fit="cover" alt={article.title} fallbackSrc="https://placehold.co/600x320?text=Article" />
          </Box>
        )}
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
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
          <Text fw={700} size="sm" lineClamp={1} style={{ lineHeight: 1.35 }}>
            {article.title}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={2} style={{ lineHeight: 1.4 }}>
            {article.excerpt}
          </Text>
          <Group gap={4} mt={2} c="blue" style={{ fontWeight: 600, fontSize: '12px' }}>
            {t.read}
            <IconArrowUpRight size={13} />
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}

export default function Blog({ articles = [], locale = 'fr', compact = false, profileUrl = 'https://medium.com/@nkaurelien' }) {
  const t = { ...(LABELS[locale] || LABELS.fr), __locale: locale };
  const list = articles;
  const MEDIUM_PROFILE_URL = profileUrl;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('Tous');

  // Mode compact (Accueil): 1er article à la une + 3 articles suivants en ligne compacte
  const featuredArticle = list[0];
  const compactOthers = list.slice(1, 4);

  // Extraction dynamique des catégories avec comptage
  const availableTags = useMemo(() => {
    const counts = {};
    articles.forEach(a => {
      (a.categories || []).forEach(cat => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return [{ name: 'Tous', count: articles.length }, ...Object.entries(counts).map(([name, count]) => ({ name, count }))];
  }, [articles]);

  // Filtrage combiné pour la page dédiée uniquement
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

  // MODE COMPACT (Page d'accueil) : 1 carte à la une + liste compacte épurée
  if (compact) {
    return (
      <Container size="md" py={50}>
        <Stack align="center" gap="xs" mb="lg">
          <Group gap={6} c="blue">
            <IconNews size={18} />
            <Text fw={700} size="sm" tt="uppercase" style={{ letterSpacing: '1px' }}>
              {t.kicker}
            </Text>
          </Group>
          <Title order={3} ta="center">
            {t.title}
          </Title>
          <Text c="dimmed" ta="center" size="sm" style={{ maxWidth: 520, lineHeight: 1.5 }}>
            {t.subtitle}
          </Text>
        </Stack>

        <Stack gap="md">
          {/* Article #1 à la une */}
          <FeaturedArticleCard article={featuredArticle} t={t} />

          {/* Articles suivants en format ligne compacte */}
          {compactOthers.length > 0 && (
            <Stack gap="xs">
              {compactOthers.map(article => (
                <CompactArticleRow key={article.link} article={article} t={t} />
              ))}
            </Stack>
          )}
        </Stack>

        <Group justify="center" mt="xl" gap="md">
          <Button component={Link} href={`/${locale}/blog`} variant="filled" size="sm" rightSection={<IconArrowRight size={16} />}>
            {t.seeAll}
          </Button>
          <Button
            component="a"
            href={MEDIUM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            size="sm"
            rightSection={<IconArrowUpRight size={16} />}>
            {t.onMedium}
          </Button>
        </Group>
      </Container>
    );
  }

  // MODE COMPLET (Page /blog dédiée) : 2 colonnes avec Aside recherche + tag pills à gauche
  return (
    <Container size="lg" py={60}>
      <Stack align="center" gap="xs" mb="xl">
        <Group gap={6} c="blue">
          <IconNews size={18} />
          <Text fw={700} size="sm" tt="uppercase" style={{ letterSpacing: '1px' }}>
            {t.kicker}
          </Text>
        </Group>
        <Title order={2} ta="center">
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

          {/* Section : Roadmap & Idées d'Articles à Paraître sur Medium */}
          <Paper withBorder p="lg" radius="xl" mt={40} style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <ThemeIcon color="indigo" size="md" radius="md" variant="light">
                    <IconBulb size={18} />
                  </ThemeIcon>
                  <Box>
                    <Title order={4} size="h5">
                      💡 Prochains Articles & Roadmap de Rédaction Medium
                    </Title>
                    <Text size="xs" c="dimmed">
                      Idées de sujets techniques et retours d&apos;expérience en cours de rédaction basés sur mes projets réels.
                    </Text>
                  </Box>
                </Group>
                <Badge color="indigo" variant="outline" size="sm">
                  {UPCOMING_ARTICLES.length} sujets en préparation
                </Badge>
              </Group>

              <Divider />

              <Grid gutter="md">
                {UPCOMING_ARTICLES.map((article, idx) => (
                  <Grid.Col key={idx} span={{ base: 12, sm: 6 }}>
                    <UpcomingArticleCard article={article} locale={locale} />
                  </Grid.Col>
                ))}
              </Grid>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
