import { Container, Title, SimpleGrid, Card, Avatar, Text, Group, Stack, ActionIcon } from '@mantine/core';
import { IconStarFilled, IconStar, IconBrandLinkedin, IconQuote } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

function Stars({ rating = 5 }) {
  return (
    <Group gap={2}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < rating ? (
          <IconStarFilled key={i} size={16} color="var(--mantine-color-yellow-6)" />
        ) : (
          <IconStar key={i} size={16} color="var(--mantine-color-gray-4)" />
        )
      )}
    </Group>
  );
}

export default function Testimonials({ testimonials }) {
  // N'affiche que les recommandations explicitement activees (active === true).
  const items = (testimonials?.items || []).filter(t => t.active === true);
  if (items.length === 0) return null;

  return (
    <div className="section-muted">
      <Container size="lg" py={64}>
        <Title order={2} ta="center" mb="xl">
          {testimonials?.title || 'Recommandations'}
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {items.map(item => (
            <Card key={item.name} withBorder radius="lg" padding="lg" shadow="sm">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Group wrap="nowrap">
                  <Avatar src={item.image ? withBase(item.image) : undefined} name={item.name} color="brand" radius="xl" size="lg" />
                  <Stack gap={0}>
                    <Text fw={700} fz="sm" lineClamp={1}>
                      {item.name}
                    </Text>
                    <Text c="dimmed" fz="xs" lineClamp={2}>
                      {item.role}
                    </Text>
                  </Stack>
                </Group>
                {item.link && (
                  <ActionIcon
                    component="a"
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="subtle"
                    color="blue"
                    aria-label={`LinkedIn — ${item.name}`}>
                    <IconBrandLinkedin size={20} />
                  </ActionIcon>
                )}
              </Group>

              <Stars rating={item.rating} />

              <Text c="dimmed" fz="sm" mt="sm" style={{ position: 'relative' }}>
                <IconQuote size={18} style={{ opacity: 0.25, marginRight: 4, verticalAlign: 'text-top' }} />
                {item.text}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </div>
  );
}
