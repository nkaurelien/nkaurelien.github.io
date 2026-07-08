'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Container, Title, SimpleGrid, Card, Image, Text, Badge, Button, Group, Chip, Modal, Stack, ActionIcon } from '@mantine/core';
import { withBase } from '@/lib/asset';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { IconRefresh } from '@tabler/icons-react';

function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, '');
}

export default function ProjectsGrid({ projects, meta, locale }) {
  const categories = meta?.categories || [];
  const [active, setActive] = useState('all');
  const containerRef = useRef(null);

  // Firestore Projects
  const [dbProjects, setDbProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchDbProjects = async () => {
    try {
      const snap = await getDocs(collection(db, 'projects'));
      const list = snap.docs.map(doc => ({ id: doc.id, slug: doc.id, ...doc.data() }));
      setDbProjects(list);
    } catch (err) {
      console.error('Error loading projects from Firestore:', err);
    }
  };

  useEffect(() => {
    fetchDbProjects();
  }, []);

  const allProjects = [
    ...projects,
    ...dbProjects.map(p => ({
      slug: p.slug || p.id,
      title: p.title,
      image: p.thumbnailUrl,
      category: p.category,
      categorySlug: p.category ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      description: p.description,
      link: p.url || null,
      tech: p.tech || '',
      isDynamic: true,
    })),
  ];

  const filtered = active === 'all' ? allProjects : allProjects.filter(p => p.categorySlug === active);
  const viewLabel = locale === 'en' ? 'View project' : 'Voir le projet';

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo('.projects-title', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo('.projects-chips', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.45')
        .fromTo('.projects-card', { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, '-=0.45');
    },
    { scope: containerRef }
  );

  return (
    <Container component="section" ref={containerRef} size="lg" py={64} style={{ overflow: 'hidden' }}>
      <Group justify="center" align="center" className="projects-title" mb="xl" gap="xs">
        <Title order={1} style={{ margin: 0 }}>
          {meta?.title || 'Projets'}
        </Title>
        <ActionIcon variant="light" color="indigo" onClick={fetchDbProjects} title="Actualiser les projets" radius="md">
          <IconRefresh size={18} />
        </ActionIcon>
      </Group>

      {categories.length > 0 && (
        <Group className="projects-chips" justify="center" mb="xl">
          <Chip.Group multiple={false} value={active} onChange={setActive}>
            <Group justify="center" gap="xs">
              <Chip value="all" variant="filled" color="brand">
                {meta?.all_categories || 'Toutes'}
              </Chip>
              {categories.map(c => (
                <Chip key={c.slug} value={c.slug} variant="filled" color="brand">
                  {c.name}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Group>
      )}

      {filtered.length === 0 ? (
        <Text ta="center" c="dimmed">
          Aucun projet dans cette catégorie.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {filtered.map(p => (
            <Card key={p.slug} component="article" withBorder radius="lg" padding="lg" shadow="sm" className="projects-card">
              {p.image && (
                <Card.Section
                  component={p.isDynamic ? 'div' : Link}
                  href={p.isDynamic ? undefined : `/${locale}/projects/${p.slug}`}
                  onClick={p.isDynamic ? () => setSelectedProject(p) : undefined}
                  style={{ cursor: p.isDynamic ? 'pointer' : undefined }}>
                  <Image src={withBase(p.image)} alt={p.title} h={180} fit="cover" />
                </Card.Section>
              )}
              <Group justify="space-between" mt="md" mb="xs" wrap="nowrap">
                <Text fw={700}>{p.title}</Text>
                <Group gap={6} wrap="nowrap">
                  {p.category && (
                    <Badge variant="light" color="brand">
                      {p.category}
                    </Badge>
                  )}
                  {p.year && (
                    <Text fz="xs" fw={600} c="dimmed">
                      {p.year}
                    </Text>
                  )}
                </Group>
              </Group>
              <Text fz="sm" c="dimmed" lineClamp={3}>
                {stripHtml(p.description)}
              </Text>
              {p.isDynamic ? (
                p.link ? (
                  <Button
                    component="a"
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="light"
                    color="brand"
                    fullWidth
                    mt="md"
                    radius="md">
                    {locale === 'en' ? 'Visit website' : 'Voir le site'}
                  </Button>
                ) : (
                  <Button onClick={() => setSelectedProject(p)} variant="light" color="brand" fullWidth mt="md" radius="md">
                    {locale === 'en' ? 'Learn more' : 'En savoir plus'}
                  </Button>
                )
              ) : (
                <Button component={Link} href={`/${locale}/projects/${p.slug}`} variant="light" color="brand" fullWidth mt="md" radius="md">
                  {viewLabel}
                </Button>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal opened={!!selectedProject} onClose={() => setSelectedProject(null)} title={selectedProject?.title} centered radius="md">
        {selectedProject && (
          <Stack gap="md">
            {selectedProject.image && <Image src={withBase(selectedProject.image)} alt={selectedProject.title} radius="md" />}
            <Group gap="xs">
              <Badge color="brand" variant="light">
                {selectedProject.category}
              </Badge>
              {selectedProject.tech && (
                <Group gap={4}>
                  {selectedProject.tech.split(',').map(tech => (
                    <Badge key={tech} variant="outline" size="xs" color="gray">
                      {tech.trim()}
                    </Badge>
                  ))}
                </Group>
              )}
            </Group>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {selectedProject.description}
            </Text>
            {selectedProject.link && (
              <Button component="a" href={selectedProject.link} target="_blank" rel="noopener noreferrer" color="indigo" fullWidth mt="xs">
                {locale === 'en' ? 'Visit website' : 'Voir le site'}
              </Button>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
