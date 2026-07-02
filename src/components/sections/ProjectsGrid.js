'use client';

import { useState } from 'react';
import { Container, Title, SimpleGrid, Card, Image, Text, Badge, Button, Group, Chip } from '@mantine/core';
import { withBase } from '@/lib/asset';

function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, '');
}

export default function ProjectsGrid({ projects, meta }) {
  const categories = meta?.categories || [];
  const [active, setActive] = useState('all');

  const filtered = active === 'all' ? projects : projects.filter(p => p.categorySlug === active);

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
                <Card.Section>
                  <Image src={withBase(p.image)} alt={p.title} h={180} fit="cover" />
                </Card.Section>
              )}
              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={700}>{p.title}</Text>
                {p.category && (
                  <Badge variant="light" color="brand">
                    {p.category}
                  </Badge>
                )}
              </Group>
              <Text fz="sm" c="dimmed" lineClamp={3}>
                {stripHtml(p.description)}
              </Text>
              {p.link && (
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
                  {p.linkLabel}
                </Button>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
