import { Container, Title, Text, SimpleGrid, Card, Badge, Group } from '@mantine/core';

export default function Skills({ skills }) {
  const groups = (skills?.groups || []).filter(g => g.active !== false);
  if (groups.length === 0) return null;

  return (
    <div className="section-muted">
      <Container size="lg" py={64}>
        <Title order={2} ta="center">
          {skills?.title || 'Compétences'}
        </Title>
        {skills?.subtitle && (
          <Text ta="center" c="dimmed" mt="xs" mb="xl">
            {skills.subtitle}
          </Text>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {groups.map(group => (
            <Card key={group.title} withBorder radius="lg" padding="lg" shadow="sm">
              <Text fw={700} mb="sm">
                {group.title}
              </Text>
              <Group gap="xs">
                {(group.items || []).map(tech => (
                  <Badge key={tech} variant="light" color="brand" radius="sm" size="md">
                    {tech}
                  </Badge>
                ))}
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </div>
  );
}
