import Link from 'next/link';
import { Container, Title, Badge, Text, Button, Group, Stack, SimpleGrid, Image, Card, Anchor } from '@mantine/core';
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

export default function ProjectDetail({ locale, project }) {
  const backLabel = locale === 'en' ? 'Back to projects' : 'Retour aux projets';
  const details = project.details;
  const carousel = project.carousel || [];

  return (
    <Container size="md" py={48}>
      <Anchor component={Link} href={`/${locale}/projects`} fz="sm" c="dimmed">
        <Group gap={4} component="span">
          <IconArrowLeft size={16} /> {backLabel}
        </Group>
      </Anchor>

      <Group justify="space-between" align="center" mt="md" mb="lg" wrap="wrap">
        <Title order={1}>{project.title}</Title>
        {project.category && (
          <Badge size="lg" variant="light" color="brand">
            {project.category}
          </Badge>
        )}
      </Group>

      {project.image && <Image src={withBase(project.image)} alt={project.title} radius="lg" mb="lg" />}

      {project.description && <Text c="dimmed" mb="lg" dangerouslySetInnerHTML={{ __html: project.description }} />}

      {details?.items?.length > 0 && (
        <Card withBorder radius="lg" padding="lg" mb="lg">
          <Text fw={700} mb="sm">
            {details.title || 'Détails du projet'}
          </Text>
          <Stack gap="xs">
            {details.items.map(item => (
              <Group key={item.label} justify="space-between" wrap="nowrap">
                <Text fz="sm" c="dimmed">
                  {item.label}
                </Text>
                <Text fz="sm" fw={500} ta="right">
                  {item.value}
                </Text>
              </Group>
            ))}
          </Stack>
        </Card>
      )}

      {carousel.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="lg">
          {carousel.map((img, i) => (
            <Image key={i} src={withBase(img.image)} alt={img.alt || project.title} radius="md" />
          ))}
        </SimpleGrid>
      )}

      {project.link && (
        <Button
          component="a"
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          color="brand"
          radius="md"
          rightSection={<IconExternalLink size={16} />}>
          {project.linkLabel}
        </Button>
      )}
    </Container>
  );
}
