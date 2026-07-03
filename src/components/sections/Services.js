import { Container, Title, SimpleGrid, Card, Text, ThemeIcon } from '@mantine/core';
import { IconCode, IconServerCog, IconRobot, IconSparkles, IconActivityHeartbeat, IconSitemap, IconSchool, IconStar } from '@tabler/icons-react';

const ICONS = {
  code: IconCode,
  devops: IconServerCog,
  ai: IconRobot,
  aidev: IconSparkles,
  iot: IconActivityHeartbeat,
  architecture: IconSitemap,
  training: IconSchool,
};

export default function Services({ services }) {
  const items = (services?.items || []).filter(i => i.active !== false);

  return (
    <Container size="lg" py={64}>
      <Title order={2} ta="center">
        {services?.title || 'Mes Services'}
      </Title>
      {services?.subtitle && (
        <Text ta="center" c="dimmed" mt="xs" mb="xl" maw={720} mx="auto">
          {services.subtitle}
        </Text>
      )}
      {!services?.subtitle && <div style={{ marginBottom: 'var(--mantine-spacing-xl)' }} />}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {items.map(item => {
          const Icon = ICONS[item.icon] || IconStar;
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
