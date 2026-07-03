'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container, Title, SimpleGrid, Card, Image, Text, Badge, Button, Group, Chip } from '@mantine/core';
import { withBase } from '@/lib/asset';

function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, '');
}

export default function ProjectsGrid({ projects, meta, locale }) {
  const categories = meta?.categories || [];
  const [active, setActive] = useState('all');

  const filtered = active === 'all' ? projects : projects.filter(p => p.categorySlug === active);
  const viewLabel = locale === 'en' ? 'View project' : 'Voir le projet';

  return (
    <Container size="lg" py={64}>
      <Title order={2} ta="center" mb="lg">
        {meta?.title || 'Projets'}
      </Title>

      {categories.length > 0 && (
        <Group justify="center" mb="xl">
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
            <Card key={p.slug} withBorder radius="lg" padding="lg" shadow="sm">
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
