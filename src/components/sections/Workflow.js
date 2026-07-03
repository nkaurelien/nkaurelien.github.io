import { Container, Title, Text, SimpleGrid, Card, Stack, Group, ThemeIcon } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

export default function Workflow({ workflow }) {
  const groups = (workflow?.groups || []).filter(g => g.active !== false);
  if (groups.length === 0) return null;

  return (
    <Container size="lg" py={64}>
      <Title order={2} ta="center">
        {workflow?.title || 'Environnement & rituels'}
      </Title>
      {workflow?.subtitle && (
        <Text ta="center" c="dimmed" mt="xs" mb="xl">
          {workflow.subtitle}
        </Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {groups.map(group => (
          <Card key={group.title} withBorder radius="lg" padding="lg" shadow="sm">
            <Text fw={700} mb="md">
              {group.title}
            </Text>
            <Stack gap="xs">
              {(group.items || []).map(item => (
                <Group key={item} gap="xs" wrap="nowrap" align="center">
                  <ThemeIcon size={20} radius="xl" variant="light" color="brand">
                    <IconCheck size={12} />
                  </ThemeIcon>
                  <Text fz="sm">{item}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
