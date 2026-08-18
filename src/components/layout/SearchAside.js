'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Drawer,
  TextInput,
  Group,
  Stack,
  Text,
  Badge,
  Card,
  UnstyledButton,
  ActionIcon,
  Box,
  Kbd,
  ScrollArea,
  Divider,
} from '@mantine/core';
import { IconSearch, IconX, IconArrowUpRight, IconRocket, IconNews, IconTools, IconCode, IconAdjustmentsHorizontal } from '@tabler/icons-react';

const SEARCH_INDEX = [
  // Projets
  {
    id: 'proj-kamitbrains',
    type: 'Projets',
    category: 'Fullstack & IA',
    title: 'Kamitbrains — Plateforme d’IA & Édition',
    description: 'Plateforme SaaS complète avec assistants IA générative, génération de contenu et paiement.',
    link: '/projects/kamitbrains',
    tags: ['Next.js', 'FastAPI', 'IA', 'RAG', 'Stripe'],
  },
  {
    id: 'proj-fiches-travail',
    type: 'Projets',
    category: 'Data & Cloud',
    title: 'Fiches Travail Data & Analytics',
    description: 'Traitement de données volumineuses, pipelines ETL et tableaux de bord analytiques.',
    link: '/projects/fiches-travail-data',
    tags: ['Python', 'PostgreSQL', 'Docker', 'Grafana'],
  },
  {
    id: 'proj-koree',
    type: 'Projets',
    category: 'Mobile & FinTech',
    title: 'Koree — Application Mobile CashBack',
    description: 'Application mobile de fidélisation et cashback avec paiement mobile money.',
    link: '/projects/koree',
    tags: ['Flutter', 'Laravel', 'REST API', 'Mobile Money'],
  },

  // Services
  {
    id: 'serv-fullstack',
    type: 'Expertise',
    category: 'Engineering',
    title: 'Tech Lead & Développement Fullstack',
    description: 'Conception et architecture d’applications web & mobiles : Next.js 15, React, Angular, FastAPI, Laravel, Flutter.',
    link: '/#services',
    tags: ['Next.js 15', 'React', 'Angular', 'FastAPI', 'Laravel', 'Flutter'],
  },
  {
    id: 'serv-devsecops',
    type: 'Expertise',
    category: 'Cloud & Infra',
    title: 'DevSecOps & Cloud Native',
    description: 'CI/CD GitLab, Docker, Ansible, Terraform, Kubernetes, observabilité (Grafana, Loki, ELK) et Snyk.',
    link: '/#services',
    tags: ['DevSecOps', 'GitLab CI', 'Docker', 'Terraform', 'Kubernetes', 'Snyk'],
  },
  {
    id: 'serv-ai',
    type: 'Expertise',
    category: 'Intelligence Artificielle',
    title: 'IA & Applications RAG',
    description: 'Assistants et chatbots métiers : LangChain, LiteLLM, OpenAI, Ollama / Qwen, Qdrant, pgvector.',
    link: '/#services',
    tags: ['LangChain', 'LiteLLM', 'OpenAI', 'Ollama', 'Qdrant', 'RAG'],
  },
  {
    id: 'serv-agentic',
    type: 'Expertise',
    category: 'IA Agentique',
    title: 'Développement Augmenté par l’IA & Agentique',
    description: 'Dev agentique (Claude 3.7 / Claude Code, Antigravity) et Spec-Driven Development (GitHub SpecKit).',
    link: '/#services',
    tags: ['Claude IA', 'SpecKit', 'Agentic Dev', 'Claude Code'],
  },
  {
    id: 'serv-iot',
    type: 'Expertise',
    category: 'IoT & Streaming',
    title: 'IoT & Pipelines Temps Réel',
    description: 'Data streaming avec Redpanda / Apache Kafka, objets connectés (EmotiBit, Withings) et FHIR/HL7.',
    link: '/#services',
    tags: ['Redpanda', 'Apache Kafka', 'IoT', 'FHIR', 'HL7'],
  },

  // Stack & Technologies
  {
    id: 'tech-claude',
    type: 'Stack & Tech',
    category: 'IA Agentique',
    title: 'Claude 3.7 & Claude Code',
    description: 'Ingénierie de prompts et agents autonomes de développement logiciel.',
    link: '/#skills',
    tags: ['Claude IA', 'SpecKit', 'IA'],
  },
  {
    id: 'tech-speckit',
    type: 'Stack & Tech',
    category: 'Méthodologie',
    title: 'GitHub SpecKit (Spec-Driven Dev)',
    description: 'Spécifications exécutables et développement guidé par les spécifications.',
    link: '/#skills',
    tags: ['SpecKit', 'SDLC'],
  },
  {
    id: 'tech-redpanda',
    type: 'Stack & Tech',
    category: 'Data Streaming',
    title: 'Redpanda / Apache Kafka',
    description: 'Event streaming haute performance et pipelines de données en temps réel.',
    link: '/#skills',
    tags: ['Redpanda', 'Kafka', 'Streaming'],
  },
  {
    id: 'tech-next',
    type: 'Stack & Tech',
    category: 'Frontend',
    title: 'Next.js 15 & React 19',
    description: 'Framework moderne avec Server Components et rendu hybride SSG/SSR.',
    link: '/#skills',
    tags: ['Next.js 15', 'React', 'Fullstack'],
  },

  // Blog
  {
    id: 'blog-ssh-mesh',
    type: 'Blog',
    category: 'DevOps & Reseaux',
    title: 'Du Tunnel SSH au Mesh VPN : Accès Ops Sécurisé',
    description: 'Guide complet pour sécuriser les accès d’administration infrastructure.',
    link: '/blog/du-tunnel-ssh-au-mesh-vpn-acces-ops',
    tags: ['VPN', 'SSH', 'Security', 'DevOps'],
  },
];

const TAG_PILLS = ['Tous', 'Projets', 'Expertise', 'Stack & Tech', 'Blog'];

export default function SearchAside({ opened, onClose, locale = 'fr' }) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Tous');

  // Raccourci clavier Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (opened) {
          onClose();
        } else {
          // Trigger open via document event if needed
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [opened, onClose]);

  const filteredResults = useMemo(() => {
    return SEARCH_INDEX.filter(item => {
      // Fitre par Tag / Catégorie
      if (selectedTag !== 'Tous' && item.type !== selectedTag) {
        return false;
      }
      // Filtre par Recherche texte
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [query, selectedTag]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={440}
      title={
        <Group gap="xs">
          <IconSearch size={20} color="var(--mantine-color-brand-6)" />
          <Text fw={700} size="md">
            {locale === 'en' ? 'Search & Filters' : 'Recherche & Filtres'}
          </Text>
        </Group>
      }
      padding="md"
      overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      styles={{
        header: {
          borderBottom: '1px solid var(--mantine-color-default-border)',
          paddingBottom: '12px',
        },
        body: {
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 60px)',
        },
      }}>
      <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
        {/* Champ de recherche */}
        <TextInput
          placeholder={locale === 'en' ? 'Search projects, tools, services...' : 'Rechercher un projet, outil, service...'}
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            query ? (
              <ActionIcon variant="subtle" size="sm" onClick={() => setQuery('')}>
                <IconX size={14} />
              </ActionIcon>
            ) : (
              <Kbd size="xs">⌘K</Kbd>
            )
          }
          radius="md"
          size="sm"
          autoFocus
        />

        {/* Filtres Pills de Tags */}
        <Box>
          <Group gap={6} wrap="wrap">
            {TAG_PILLS.map(tag => {
              const active = selectedTag === tag;
              return (
                <UnstyledButton key={tag} onClick={() => setSelectedTag(tag)}>
                  <Badge
                    size="sm"
                    variant={active ? 'filled' : 'light'}
                    color={active ? 'blue' : 'gray'}
                    style={{
                      cursor: 'pointer',
                      textTransform: 'none',
                      transition: 'all 0.15s ease',
                      fontWeight: active ? 700 : 500,
                    }}>
                    {tag}
                  </Badge>
                </UnstyledButton>
              );
            })}
          </Group>
        </Box>

        <Divider />

        {/* Liste des Résultats filtrés */}
        <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
          {filteredResults.length === 0 ? (
            <Box ta="center" py="xl">
              <Text size="sm" c="dimmed">
                {locale === 'en' ? 'No results found for your search.' : 'Aucun résultat trouvé pour votre recherche.'}
              </Text>
            </Box>
          ) : (
            <Stack gap="xs" pb="md">
              {filteredResults.map(item => (
                <Card
                  key={item.id}
                  component={Link}
                  href={item.link}
                  onClick={onClose}
                  withBorder
                  padding="xs"
                  radius="md"
                  className="search-result-card"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s ease',
                  }}>
                  <Group justify="space-between" align="flex-start" wrap="nowrap" mb={4}>
                    <Badge size="xs" variant="outline" color={item.type === 'Projets' ? 'teal' : item.type === 'Expertise' ? 'indigo' : item.type === 'Blog' ? 'orange' : 'cyan'}>
                      {item.type}
                    </Badge>
                    <IconArrowUpRight size={14} style={{ opacity: 0.6 }} />
                  </Group>

                  <Text fw={600} size="sm" lineClamp={1}>
                    {item.title}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
                    {item.description}
                  </Text>

                  <Group gap={4} mt={6}>
                    {item.tags.slice(0, 4).map(t => (
                      <Badge key={t} size="xs" variant="subtle" color="gray" style={{ fontSize: '10px' }}>
                        {t}
                      </Badge>
                    ))}
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Stack>
    </Drawer>
  );
}
