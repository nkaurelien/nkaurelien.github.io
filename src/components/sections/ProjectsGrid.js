'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Container, Title, SimpleGrid, Card, Image, Text, Badge, Button, Group, Chip } from '@mantine/core';
import { withBase } from '@/lib/asset';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, '');
}

export default function ProjectsGrid({ projects, meta, locale }) {
  const categories = meta?.categories || [];
  const [active, setActive] = useState('all');
  const containerRef = useRef(null);

  const filtered = active === 'all' ? projects : projects.filter(p => p.categorySlug === active);
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
      <Title className="projects-title" order={1} ta="center" mb="xl">
        {meta?.title || 'Projets'}
      </Title>

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
                <Card.Section component={Link} href={`/${locale}/projects/${p.slug}`}>
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
              <Button component={Link} href={`/${locale}/projects/${p.slug}`} variant="light" color="brand" fullWidth mt="md" radius="md">
                {viewLabel}
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
