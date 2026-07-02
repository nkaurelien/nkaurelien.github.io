import { Container, Title, Text, SimpleGrid, Card, Avatar, Group, Stack, ThemeIcon } from '@mantine/core';
import { IconBrandLinkedin } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

export default function Collaborations({ collaborators }) {
  const items = (collaborators?.items || []).filter(i => i.active !== false);
  if (items.length === 0) return null;

  return (
    <Container size="lg" py={64}>
      <Title order={2} ta="center">
        {collaborators?.title || 'Collaborations'}
      </Title>
      {collaborators?.subtitle && (
        <Text ta="center" c="dimmed" mt="xs" mb="xl">
          {collaborators.subtitle}
        </Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {items.map(item => (
          <Card
            key={item.name}
            component="a"
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            withBorder
            radius="lg"
            padding="lg"
            shadow="sm">
            <Group wrap="nowrap" justify="space-between">
              <Group wrap="nowrap">
                <Avatar src={item.image ? withBase(item.image) : undefined} name={item.name} color="brand" radius="xl" size="md" />
                <Stack gap={0}>
                  <Text fw={700} fz="sm" lineClamp={1}>
                    {item.name}
                  </Text>
                  <Text c="dimmed" fz="xs" lineClamp={2}>
                    {item.role}
                  </Text>
                </Stack>
              </Group>
              <ThemeIcon variant="subtle" color="blue" size="md">
                <IconBrandLinkedin size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
