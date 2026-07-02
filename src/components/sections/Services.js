import { Container, Title, SimpleGrid, Card, Text, ThemeIcon } from '@mantine/core';
import { IconCode, IconSearch, IconBook } from '@tabler/icons-react';

const ICONS = [IconCode, IconSearch, IconBook];

export default function Services({ services }) {
  const items = (services?.items || []).filter(i => i.active !== false);

  return (
    <Container size="lg" py={64}>
      <Title order={2} ta="center" mb="xl">
        {services?.title || 'Mes Services'}
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <Card key={item.title} withBorder radius="lg" padding="xl" shadow="sm">
              <ThemeIcon size={54} radius="md" variant="light" color="brand" mb="md">
                <Icon size={28} />
              </ThemeIcon>
              <Text fw={700} fz="lg" mb="xs">
                {item.title}
              </Text>
              <Text c="dimmed" fz="sm">
                {item.text}
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}
